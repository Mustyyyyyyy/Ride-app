const pool = require("../config/db");

exports.getDashboard = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const walletResult = await pool.query(
      `
      SELECT balance
      FROM wallets
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    const statsResult = await pool.query(
      `
      SELECT
        COUNT(*)::int AS total_rides,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_rides,
        COUNT(*) FILTER (
          WHERE status IN ('pending', 'accepted', 'ongoing')
        )::int AS pending_rides,
        COALESCE(SUM(price), 0)::numeric AS total_spent
      FROM rides
      WHERE passenger_id = $1
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
      SELECT id, subject, category, message, status, created_at
      FROM support_tickets
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 5
      `,
      [userId]
    );

    return res.status(200).json({
      stats: {
        total_rides: Number(statsResult.rows[0]?.total_rides || 0),
        completed_rides: Number(statsResult.rows[0]?.completed_rides || 0),
        pending_rides: Number(statsResult.rows[0]?.pending_rides || 0),
        total_spent: Number(statsResult.rows[0]?.total_spent || 0),
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
    const userId = Number(req.user.id);

    const result = await pool.query(
      `
      SELECT balance
      FROM wallets
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    return res.status(200).json({
      wallet: {
        balance: Number(result.rows[0]?.balance || 0),
      },
    });
  } catch (error) {
    console.error("GET WALLET ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching wallet",
      error: error.message,
    });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const result = await pool.query(
      `
      SELECT id, amount, type, status, reference, created_at
      FROM transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return res.status(200).json({
      transactions: result.rows,
    });
  } catch (error) {
    console.error("GET TRANSACTIONS ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching transactions",
      error: error.message,
    });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const result = await pool.query(
      `
      SELECT id, title, message, type, is_read, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return res.status(200).json({
      notifications: result.rows,
    });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching notifications",
      error: error.message,
    });
  }
};

exports.getSupportTickets = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const result = await pool.query(
      `
      SELECT id, subject, category, message, status, created_at
      FROM support_tickets
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return res.status(200).json({
      tickets: result.rows,
    });
  } catch (error) {
    console.error("GET SUPPORT TICKETS ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching support tickets",
      error: error.message,
    });
  }
};

exports.createSupportTicket = async (req, res) => {
  try {
    const userId = Number(req.user.id);
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
      RETURNING id, subject, category, message, status, created_at
      `,
      [
        userId,
        subject.trim(),
        category || "general",
        message.trim(),
        "open",
      ]
    );

    return res.status(201).json({
      message: "Support ticket created successfully",
      ticket: result.rows[0],
    });
  } catch (error) {
    console.error("CREATE SUPPORT TICKET ERROR:", error);
    return res.status(500).json({
      message: "Server error while creating support ticket",
      error: error.message,
    });
  }
};