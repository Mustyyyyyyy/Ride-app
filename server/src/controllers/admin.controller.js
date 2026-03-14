const pool = require("../config/db");

const notifyUser = async (userId, title, message, type = "system", rideId = null) => {
  await pool.query(
    `INSERT INTO notifications (user_id, title, message, type, ride_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, title, message, type, rideId]
  );
};

exports.getAdminDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalPassengers,
      totalDrivers,
      totalAdmins,
      totalRides,
      pendingRides,
      acceptedRides,
      ongoingRides,
      completedRides,
      cancelledRides,
      pendingDriverApprovals,
      approvedDrivers,
      totalWalletBalance,
      openSafetyReports,
      openSupportTickets,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM users`),
      pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'passenger'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'driver'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM rides`),
      pool.query(`SELECT COUNT(*)::int AS count FROM rides WHERE status = 'pending'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM rides WHERE status = 'accepted'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM rides WHERE status = 'ongoing'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM rides WHERE status = 'completed'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM rides WHERE status = 'cancelled'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM driver_profiles WHERE is_approved = FALSE`),
      pool.query(`SELECT COUNT(*)::int AS count FROM driver_profiles WHERE is_approved = TRUE`),
      pool.query(`SELECT COALESCE(SUM(balance), 0)::float AS total FROM wallets`),
      pool.query(`SELECT COUNT(*)::int AS count FROM safety_reports WHERE status IN ('open','reviewing')`),
      pool.query(`SELECT COUNT(*)::int AS count FROM support_tickets WHERE status IN ('open','reviewing')`),
    ]);

    res.json({
      stats: {
        users: {
          totalUsers: totalUsers.rows[0].count,
          totalPassengers: totalPassengers.rows[0].count,
          totalDrivers: totalDrivers.rows[0].count,
          totalAdmins: totalAdmins.rows[0].count,
        },
        rides: {
          totalRides: totalRides.rows[0].count,
          pendingRides: pendingRides.rows[0].count,
          acceptedRides: acceptedRides.rows[0].count,
          ongoingRides: ongoingRides.rows[0].count,
          completedRides: completedRides.rows[0].count,
          cancelledRides: cancelledRides.rows[0].count,
        },
        drivers: {
          pendingDriverApprovals: pendingDriverApprovals.rows[0].count,
          approvedDrivers: approvedDrivers.rows[0].count,
        },
        finance: {
          totalWalletBalance: totalWalletBalance.rows[0].total,
        },
        support: {
          openSafetyReports: openSafetyReports.rows[0].count,
          openSupportTickets: openSupportTickets.rows[0].count,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching admin dashboard" });
  }
};

exports.getPassengers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, role, is_verified, created_at
       FROM users WHERE role = 'passenger'
       ORDER BY created_at DESC`
    );
    res.json({ passengers: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching passengers" });
  }
};

exports.getDrivers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.is_verified, u.created_at,
              dp.vehicle_type, dp.vehicle_brand, dp.vehicle_model, dp.plate_number,
              dp.license_number, dp.is_approved, dp.is_online, dp.is_available,
              dp.rating, dp.total_rides
       FROM users u
       LEFT JOIN driver_profiles dp ON u.id = dp.user_id
       WHERE u.role = 'driver'
       ORDER BY u.created_at DESC`
    );
    res.json({ drivers: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching drivers" });
  }
};

exports.getDriverById = async (req, res) => {
  try {
    const driver = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.is_verified,
              dp.*
       FROM users u
       LEFT JOIN driver_profiles dp ON u.id = dp.user_id
       WHERE u.id = $1 AND u.role = 'driver'`,
      [req.params.id]
    );

    if (!driver.rows.length) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const rides = await pool.query(
      `SELECT * FROM rides WHERE driver_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [req.params.id]
    );

    res.json({
      driver: driver.rows[0],
      recentRides: rides.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching driver" });
  }
};

exports.approveDriver = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE driver_profiles
       SET is_approved = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    await notifyUser(
      Number(req.params.id),
      "Driver profile approved",
      "Congratulations! Your driver profile has been approved.",
      "driver"
    );

    res.json({ message: "Driver approved successfully", profile: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error approving driver" });
  }
};

exports.rejectDriver = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE driver_profiles
       SET is_approved = FALSE, is_online = FALSE, is_available = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    await notifyUser(
      Number(req.params.id),
      "Driver approval removed",
      "Your driver approval status has been removed. Contact support for details.",
      "driver"
    );

    res.json({ message: "Driver approval removed successfully", profile: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error updating driver approval" });
  }
};

exports.getAllRides = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
              p.name AS passenger_name,
              d.name AS driver_name
       FROM rides r
       LEFT JOIN users p ON r.passenger_id = p.id
       LEFT JOIN users d ON r.driver_id = d.id
       ORDER BY r.created_at DESC`
    );

    res.json({ rides: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching rides" });
  }
};

exports.getRideById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
              p.name AS passenger_name,
              d.name AS driver_name
       FROM rides r
       LEFT JOIN users p ON r.passenger_id = p.id
       LEFT JOIN users d ON r.driver_id = d.id
       WHERE r.id = $1`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Ride not found" });
    }

    res.json({ ride: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching ride" });
  }
};

exports.getSafetyReports = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM safety_reports ORDER BY created_at DESC`
    );

    res.json({ reports: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching safety reports" });
  }
};

exports.updateSafetyReport = async (req, res) => {
  try {
    const { status, adminNote, priority } = req.body;

    const result = await pool.query(
      `UPDATE safety_reports
       SET status = COALESCE($1, status),
           admin_note = COALESCE($2, admin_note),
           priority = COALESCE($3, priority),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, adminNote, priority, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Safety report not found" });
    }

    res.json({
      message: "Safety report updated successfully",
      report: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error updating safety report" });
  }
};

exports.getSupportTickets = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM support_tickets ORDER BY created_at DESC`
    );

    res.json({ tickets: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching support tickets" });
  }
};

exports.updateSupportTicket = async (req, res) => {
  try {
    const { status, adminResponse } = req.body;

    const result = await pool.query(
      `UPDATE support_tickets
       SET status = COALESCE($1, status),
           admin_response = COALESCE($2, admin_response),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, adminResponse, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Support ticket not found" });
    }

    res.json({
      message: "Support ticket updated successfully",
      ticket: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error updating support ticket" });
  }
};