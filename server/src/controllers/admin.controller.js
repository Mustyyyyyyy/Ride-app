const pool = require("../config/db");

exports.getDashboard = async (req, res) => {
  try {
    const usersResult = await pool.query(
      `
      SELECT COUNT(*)::int AS total_users
      FROM users
      `
    );

    const driversResult = await pool.query(
      `
      SELECT COUNT(*)::int AS total_drivers
      FROM users
      WHERE role = 'driver'
      `
    );

    const ridesResult = await pool.query(
      `
      SELECT COUNT(*)::int AS total_rides
      FROM rides
      `
    );

    const ticketsResult = await pool.query(
      `
      SELECT COUNT(*)::int AS open_tickets
      FROM support_tickets
      WHERE status = 'open'
      `
    );

    const recentUsersResult = await pool.query(
      `
      SELECT id, name, email, role
      FROM users
      ORDER BY id DESC
      LIMIT 5
      `
    );

    const recentRidesResult = await pool.query(
      `
      SELECT
        r.id,
        r.pickup,
        r.dropoff,
        r.status,
        r.price
      FROM rides r
      ORDER BY r.created_at DESC
      LIMIT 5
      `
    );

    return res.status(200).json({
      stats: {
        total_users: Number(usersResult.rows[0]?.total_users || 0),
        total_drivers: Number(driversResult.rows[0]?.total_drivers || 0),
        total_rides: Number(ridesResult.rows[0]?.total_rides || 0),
        open_tickets: Number(ticketsResult.rows[0]?.open_tickets || 0),
      },
      recentUsers: recentUsersResult.rows || [],
      recentRides: recentRidesResult.rows || [],
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching admin dashboard",
      error: error.message,
    });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, name, email, phone, role, is_verified, created_at
      FROM users
      ORDER BY id DESC
      `
    );

    return res.status(200).json({
      users: result.rows || [],
    });
  } catch (error) {
    console.error("GET ADMIN USERS ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching users",
      error: error.message,
    });
  }
};

exports.getSupportTickets = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        s.id,
        s.subject,
        s.category,
        s.message,
        s.status,
        s.created_at,
        u.name AS user_name,
        u.email AS user_email
      FROM support_tickets s
      INNER JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
      `
    );

    return res.status(200).json({
      tickets: result.rows || [],
    });
  } catch (error) {
    console.error("GET ADMIN SUPPORT TICKETS ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching support tickets",
      error: error.message,
    });
  }
};

exports.getDrivers = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        dp.vehicle_model,
        dp.plate_number,
        dp.vehicle_color,
        dp.is_online
      FROM users u
      LEFT JOIN driver_profiles dp ON u.id = dp.user_id
      WHERE u.role = 'driver'
      ORDER BY u.id DESC
      `
    );

    return res.status(200).json({
      drivers: result.rows,
    });
  } catch (error) {
    console.error("GET ADMIN DRIVERS ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching drivers",
      error: error.message,
    });
  }
};

exports.getRides = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        r.id,
        r.pickup,
        r.dropoff,
        r.status,
        r.price,
        r.created_at,
        p.name AS passenger_name,
        d.name AS driver_name
      FROM rides r
      INNER JOIN users p ON r.passenger_id = p.id
      LEFT JOIN users d ON r.driver_id = d.id
      ORDER BY r.created_at DESC
      `
    );

    return res.status(200).json({
      rides: result.rows,
    });
  } catch (error) {
    console.error("GET ADMIN RIDES ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching rides",
      error: error.message,
    });
  }
};

exports.getSupportTickets = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        s.id,
        s.subject,
        s.category,
        s.message,
        s.status,
        s.created_at,
        u.name AS user_name,
        u.email AS user_email
      FROM support_tickets s
      INNER JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
      `
    );

    return res.status(200).json({
      tickets: result.rows,
    });
  } catch (error) {
    console.error("GET ADMIN SUPPORT TICKETS ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching support tickets",
      error: error.message,
    });
  }
};

exports.updateSupportTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["open", "resolved"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Valid support status is required",
      });
    }

    const result = await pool.query(
      `
      UPDATE support_tickets
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, Number(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Support ticket not found",
      });
    }

    return res.status(200).json({
      message: "Support ticket updated successfully",
      ticket: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE SUPPORT TICKET STATUS ERROR:", error);
    return res.status(500).json({
      message: "Server error while updating support ticket",
      error: error.message,
    });
  }
};