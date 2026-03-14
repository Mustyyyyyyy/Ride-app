const pool = require("../config/db");

exports.getDashboard = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const statsResult = await pool.query(
      `
      SELECT
        COUNT(*)::int AS total_rides,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_rides,
        COUNT(*) FILTER (WHERE status IN ('pending', 'accepted', 'ongoing'))::int AS pending_rides,
        COALESCE(SUM(price), 0)::numeric AS total_spent
      FROM rides
      WHERE passenger_id = $1
      `,
      [userId]
    );

    const walletResult = await pool.query(
      `
      SELECT balance
      FROM wallets
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    const recentRidesResult = await pool.query(
      `
      SELECT id, pickup, dropoff, status, price, created_at
      FROM rides
      WHERE passenger_id = $1
      ORDER BY created_at DESC
      LIMIT 5
      `,
      [userId]
    );

    const notificationsResult = await pool.query(
      `
      SELECT id, title, message, type, is_read, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 5
      `,
      [userId]
    );

    const ticketsResult = await pool.query(
      `
      SELECT id, subject, category, status, created_at
      FROM support_tickets
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 5
      `,
      [userId]
    );

    return res.status(200).json({
      stats: statsResult.rows[0] || {
        total_rides: 0,
        completed_rides: 0,
        pending_rides: 0,
        total_spent: 0,
      },
      wallet: {
        balance: Number(walletResult.rows[0]?.balance || 0),
      },
      recentRides: recentRidesResult.rows || [],
      notifications: notificationsResult.rows || [],
      tickets: ticketsResult.rows || [],
    });
  } catch (error) {
    console.error("PASSENGER DASHBOARD ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching passenger dashboard",
      error: error.message,
    });
  }
};


exports.getWallet = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT balance
      FROM wallets
      WHERE user_id = $1
      LIMIT 1
      `,
      [req.user.id]
    );

    return res.status(200).json({
      wallet: result.rows[0] || { balance: 0 },
    });
  } catch (error) {
    console.error("GET WALLET ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching wallet",
    });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, amount, type, status, reference, created_at
      FROM transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    return res.status(200).json({
      transactions: result.rows,
    });
  } catch (error) {
    console.error("GET TRANSACTIONS ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching transactions",
    });
  }
};

exports.fundWallet = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const amount = Number(req.body.amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Valid amount is required",
      });
    }

    const existingWallet = await pool.query(
      `
      SELECT id, balance
      FROM wallets
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    if (existingWallet.rows.length === 0) {
      await pool.query(
        `
        INSERT INTO wallets (user_id, balance)
        VALUES ($1, $2)
        `,
        [userId, 0]
      );
    }

    const updateWallet = await pool.query(
      `
      UPDATE wallets
      SET balance = balance + $1
      WHERE user_id = $2
      RETURNING balance
      `,
      [amount, userId]
    );

    await pool.query(
      `
      INSERT INTO transactions (
        user_id,
        amount,
        type,
        status,
        reference,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      `,
      [
        userId,
        amount,
        "credit",
        "success",
        `FUND-${Date.now()}`,
      ]
    );

    await pool.query(
      `
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, $2, $3, $4)
      `,
      [
        userId,
        "Wallet funded",
        `Your wallet was funded with ₦${amount.toLocaleString()}.`,
        "wallet",
      ]
    );

    return res.status(200).json({
      message: "Wallet funded successfully",
      wallet: updateWallet.rows[0],
    });
  } catch (error) {
    console.error("FUND WALLET ERROR:", error);
    return res.status(500).json({
      message: "Server error while funding wallet",
      error: error.message,
    });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, title, message, type, is_read, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    return res.status(200).json({
      notifications: result.rows,
    });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching notifications",
    });
  }
};

exports.createSupportTicket = async (req, res) => {
  try {
    const { subject, category, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        message: "Subject and message are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO support_tickets (user_id, subject, category, message, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [req.user.id, subject, category || "general", message, "open"]
    );

    return res.status(201).json({
      message: "Support ticket submitted successfully",
      ticket: result.rows[0],
    });
  } catch (error) {
    console.error("CREATE SUPPORT TICKET ERROR:", error);
    return res.status(500).json({
      message: "Server error while submitting ticket",
    });
  }
};

exports.getSupportTickets = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, subject, category, message, status, created_at
      FROM support_tickets
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    return res.status(200).json({
      tickets: result.rows,
    });
  } catch (error) {
    console.error("GET SUPPORT TICKETS ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching support tickets",
    });
  }
};