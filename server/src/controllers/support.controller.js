const pool = require("../config/db");

const notifyAdmins = async (title, message, type = "admin", rideId = null) => {
  const admins = await pool.query(`SELECT id FROM users WHERE role = 'admin'`);
  for (const admin of admins.rows) {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, ride_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [admin.id, title, message, type, rideId]
    );
  }
};

exports.createSupportTicket = async (req, res) => {
  try {
    const { subject, category, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: "Subject and message are required" });
    }

    const result = await pool.query(
      `INSERT INTO support_tickets (user_id, subject, category, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, subject, category || "other", message]
    );

    await notifyAdmins(
      "New support ticket",
      `A new support ticket has been created by ${req.user.name}.`
    );

    res.status(201).json({
      message: "Support ticket created successfully",
      ticket: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error creating support ticket" });
  }
};

exports.getMySupportTickets = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({ tickets: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching support tickets" });
  }
};

exports.createSafetyReport = async (req, res) => {
  try {
    const { rideId, issueType, description, priority } = req.body;

    if (!rideId || !description) {
      return res.status(400).json({ message: "Ride ID and description are required" });
    }

    const rideResult = await pool.query(`SELECT * FROM rides WHERE id = $1`, [rideId]);

    if (!rideResult.rows.length) {
      return res.status(404).json({ message: "Ride not found" });
    }

    const ride = rideResult.rows[0];

    const result = await pool.query(
      `INSERT INTO safety_reports
       (ride_id, reported_by_id, passenger_id, driver_id, issue_type, description, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        ride.id,
        req.user.id,
        ride.passenger_id,
        ride.driver_id,
        issueType || "other",
        description,
        priority || "medium",
      ]
    );

    await notifyAdmins(
      "New safety report",
      `A new safety report has been submitted with priority ${priority || "medium"}.`,
      "admin",
      ride.id
    );

    res.status(201).json({
      message: "Safety report submitted successfully",
      report: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error creating safety report" });
  }
};

exports.sendSOS = async (req, res) => {
  try {
    const { rideId, description } = req.body;

    const rideResult = await pool.query(`SELECT * FROM rides WHERE id = $1`, [rideId]);

    if (!rideResult.rows.length) {
      return res.status(404).json({ message: "Ride not found" });
    }

    const ride = rideResult.rows[0];

    const result = await pool.query(
      `INSERT INTO safety_reports
       (ride_id, reported_by_id, passenger_id, driver_id, issue_type, description, priority)
       VALUES ($1, $2, $3, $4, 'emergency', $5, 'critical')
       RETURNING *`,
      [
        ride.id,
        req.user.id,
        ride.passenger_id,
        ride.driver_id,
        description || "Emergency SOS triggered by user",
      ]
    );

    await notifyAdmins(
      "Critical SOS alert",
      `A critical SOS alert has been triggered by ${req.user.name}.`,
      "admin",
      ride.id
    );

    res.status(201).json({
      message: "Emergency SOS sent successfully",
      report: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error sending SOS" });
  }
};

exports.getSupportTickets = async (req, res) => {
  try {
    const userId = req.user.id;

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
    const userId = req.user.id;
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