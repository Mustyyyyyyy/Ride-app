const pool = require("../config/db");

exports.getDashboard = async (req, res) => {
  try {
    const [
      usersResult,
      driversResult,
      ridesResult,
      ticketsResult,
      revenueTodayResult,
      avgWaitTimeResult,
      weeklyRevenueResult,
      ridesByTypeResult,
      recentUsersResult,
      recentRidesResult,
    ] = await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS total_users
        FROM users
      `),

      pool.query(`
        SELECT COUNT(*)::int AS total_drivers
        FROM users
        WHERE role = 'driver'
      `),

      pool.query(`
        SELECT COUNT(*)::int AS total_rides
        FROM rides
      `),

      pool.query(`
        SELECT COUNT(*)::int AS open_tickets
        FROM support_tickets
        WHERE status = 'open'
      `),

      pool.query(`
        SELECT COALESCE(SUM(price), 0)::int AS revenue_today
        FROM rides
        WHERE DATE(created_at) = CURRENT_DATE
          AND status = 'completed'
      `),

      pool.query(`
        SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60), 0)::int AS avg_wait_time
        FROM rides
        WHERE status IN ('accepted', 'ongoing', 'completed')
      `),

      pool.query(`
        SELECT
          TO_CHAR(created_at, 'Dy') AS day,
          COALESCE(SUM(price), 0)::int AS revenue
        FROM rides
        WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
          AND status = 'completed'
        GROUP BY DATE(created_at), TO_CHAR(created_at, 'Dy')
        ORDER BY DATE(created_at) ASC
      `),

      pool.query(`
        SELECT
          ride_type,
          COUNT(*)::int AS total
        FROM rides
        GROUP BY ride_type
        ORDER BY total DESC
      `),

      pool.query(`
        SELECT id, name, email, role
        FROM users
        ORDER BY id DESC
        LIMIT 5
      `),

      pool.query(`
        SELECT
          r.id,
          r.pickup,
          r.dropoff,
          r.status,
          r.price,
          r.ride_type,
          r.created_at
        FROM rides r
        ORDER BY r.created_at DESC
        LIMIT 5
      `),
    ]);

    const weeklyRevenueMap = new Map();
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((day) => {
      weeklyRevenueMap.set(day, 0);
    });

    for (const row of weeklyRevenueResult.rows || []) {
      const cleanDay = String(row.day || "").trim();
      weeklyRevenueMap.set(cleanDay, Number(row.revenue || 0));
    }

    const weeklyRevenue = Array.from(weeklyRevenueMap.entries()).map(
      ([day, revenue]) => ({
        day,
        revenue,
      })
    );

    return res.status(200).json({
      stats: {
        total_users: Number(usersResult.rows[0]?.total_users || 0),
        total_drivers: Number(driversResult.rows[0]?.total_drivers || 0),
        total_rides: Number(ridesResult.rows[0]?.total_rides || 0),
        open_tickets: Number(ticketsResult.rows[0]?.open_tickets || 0),
        revenue_today: Number(revenueTodayResult.rows[0]?.revenue_today || 0),
        avg_wait_time: Number(avgWaitTimeResult.rows[0]?.avg_wait_time || 0),
      },
      weeklyRevenue,
      ridesByType: (ridesByTypeResult.rows || []).map((item) => ({
        ride_type: item.ride_type || "standard",
        total: Number(item.total || 0),
      })),
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
    const result = await pool.query(`
      SELECT id, name, email, phone, role, is_verified, created_at
      FROM users
      ORDER BY id DESC
    `);

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

exports.getDrivers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        dp.vehicleModel,
        dp.plateNumber,
        dp.vehicleType,
        dp.vehicleBrand,
        dp.isOnline
      FROM users u
      LEFT JOIN driver_profiles dp ON u.id = dp.user_id
      WHERE u.role = 'driver'
      ORDER BY u.id DESC
    `);

    return res.status(200).json({
      drivers: result.rows || [],
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
    const result = await pool.query(`
      SELECT
        r.id,
        r.pickup,
        r.dropoff,
        r.status,
        r.fare,
        r.ride_type,
        r.created_at,
        p.name AS passenger_name,
        d.name AS driver_name
      FROM rides r
      INNER JOIN users p ON r.passenger_id = p.id
      LEFT JOIN users d ON r.driver_id = d.id
      ORDER BY r.created_at DESC
    `);

    return res.status(200).json({
      rides: result.rows || [],
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
    const result = await pool.query(`
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
    `);

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

    const result = await pool.query(`
      UPDATE support_tickets
      SET status = $1
      WHERE id = $2
      RETURNING *
    `, [status, Number(id)]);

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

exports.deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      "SELECT id, role FROM users WHERE id = $1 LIMIT 1",
      [Number(id)]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    if (existing.rows[0].role !== "driver") {
      return res.status(400).json({
        message: "Selected user is not a driver",
      });
    }

    await pool.query("DELETE FROM users WHERE id = $1", [Number(id)]);

    return res.status(200).json({
      message: "Driver deleted successfully",
    });
  } catch (error) {
    console.error("DELETE DRIVER ERROR:", error);
    return res.status(500).json({
      message: "Server error while deleting driver",
      error: error.message,
    });
  }
};

exports.getAdvancedAnalytics = async (req, res) => {
  try {
    const revenueTrend = await pool.query(`
      SELECT
        DATE(created_at) as date,
        SUM(price) as revenue
      FROM rides
      WHERE status = 'completed'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) DESC
      LIMIT 7
    `);

    const rideStats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending
      FROM rides
    `);

    const paymentStats = await pool.query(`
      SELECT
        SUM(price) FILTER (WHERE payment_method = 'wallet' AND status='completed') AS wallet,
        SUM(price) FILTER (WHERE payment_method = 'cash' AND status='completed') AS cash
      FROM rides
    `);

    const users = await pool.query(`
      SELECT COUNT(*) as total FROM users
    `);

    return res.json({
      revenueTrend: revenueTrend.rows.reverse(),
      rideStats: rideStats.rows[0],
      paymentStats: paymentStats.rows[0],
      totalUsers: users.rows[0].total,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Analytics error" });
  }
};