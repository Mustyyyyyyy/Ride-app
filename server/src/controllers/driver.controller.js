const pool = require("../config/db");
const { getIO } = require("../socket");

exports.getDashboard = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const [ridesResult, walletResult, profileResult, notificationsResult] =
      await Promise.all([
        pool.query(
          `
          SELECT r.*, u.name AS passenger_name
          FROM rides r
          INNER JOIN users u ON r.passenger_id = u.id
          WHERE r.driver_id = $1
          ORDER BY r.created_at DESC
          `,
          [userId]
        ),
        pool.query(
          `
          SELECT balance
          FROM driver_wallets
          WHERE user_id = $1
          LIMIT 1
          `,
          [userId]
        ),
        pool.query(
          `
          SELECT vehicle_model, plate_number, vehicle_color, is_online
          FROM driver_profiles
          WHERE user_id = $1
          LIMIT 1
          `,
          [userId]
        ),
        pool.query(
          `
          SELECT id, title, message, type, is_read, created_at
          FROM notifications
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT 5
          `,
          [userId]
        ),
      ]);

    const rides = ridesResult.rows || [];
    const completedTrips = rides.filter((r) => r.status === "completed").length;
    const ongoingTrips = rides.filter((r) =>
      ["accepted", "ongoing"].includes(r.status)
    ).length;
    const totalEarnings = rides
      .filter((r) => r.status === "completed")
      .reduce((sum, ride) => sum + Number(ride.price || 0), 0);

    const activeRide =
      rides.find((r) => r.status === "ongoing") ||
      rides.find((r) => r.status === "accepted") ||
      null;

    return res.status(200).json({
      stats: {
        total_trips: rides.length,
        completed_trips: completedTrips,
        ongoing_trips: ongoingTrips,
        total_earnings: totalEarnings,
      },
      wallet: walletResult.rows[0] || { balance: 0 },
      profile:
        profileResult.rows[0] || {
          vehicle_model: "",
          plate_number: "",
          vehicle_color: "",
          is_online: false,
        },
      notifications: notificationsResult.rows || [],
      recentRides: rides.slice(0, 5),
      activeRide,
    });
  } catch (error) {
    console.error("DRIVER DASHBOARD ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching driver dashboard",
      error: error.message,
    });
  }
};

exports.getAvailableRides = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const profileCheck = await pool.query(
      `
      SELECT is_online
      FROM driver_profiles
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    if (profileCheck.rows.length === 0 || !profileCheck.rows[0].is_online) {
      return res.status(200).json({
        rides: [],
      });
    }

    const result = await pool.query(
      `
      SELECT
        r.*,
        u.name AS passenger_name
      FROM rides r
      INNER JOIN users u ON r.passenger_id = u.id
      WHERE r.driver_id IS NULL
      AND r.status = 'pending'
      ORDER BY r.created_at DESC
      `
    );

    return res.status(200).json({
      rides: result.rows,
    });
  } catch (error) {
    console.error("GET AVAILABLE RIDES ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching available rides",
      error: error.message,
    });
  }
};

exports.acceptRide = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { id } = req.params;

    const profileCheck = await pool.query(
      `
      SELECT is_online
      FROM driver_profiles
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    if (profileCheck.rows.length === 0 || !profileCheck.rows[0].is_online) {
      return res.status(400).json({
        message: "You must be online to accept rides",
      });
    }

    const result = await pool.query(
      `
      UPDATE rides
      SET driver_id = $1, status = 'accepted', updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      AND driver_id IS NULL
      AND status = 'pending'
      RETURNING *
      `,
      [userId, Number(id)]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Ride is no longer available",
      });
    }

    const ride = result.rows[0];

    await pool.query(
      `
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, $2, $3, $4)
      `,
      [
        ride.passenger_id,
        "Driver assigned",
        "A driver has accepted your ride request.",
        "ride",
      ]
    );

    await pool.query(
      `
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, $2, $3, $4)
      `,
      [
        userId,
        "Ride accepted",
        `You accepted ride #${ride.id}.`,
        "ride",
      ]
    );

    const io = getIO();

    io.to(`passenger:${ride.passenger_id}`).emit("ride:accepted", { ride });
    io.to(`driver:${userId}`).emit("ride:accepted", { ride });
    io.to("drivers:lobby").emit("ride:removed", { rideId: ride.id });

    return res.status(200).json({
      message: "Ride accepted successfully",
      ride,
    });
  } catch (error) {
    console.error("ACCEPT DRIVER RIDE ERROR:", error);
    return res.status(500).json({
      message: "Server error while accepting ride",
      error: error.message,
    });
  }
};

exports.getMyTrips = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const result = await pool.query(
      `
      SELECT r.*, u.name AS passenger_name
      FROM rides r
      INNER JOIN users u ON r.passenger_id = u.id
      WHERE r.driver_id = $1
      ORDER BY r.created_at DESC
      `,
      [userId]
    );

    return res.status(200).json({
      rides: result.rows,
    });
  } catch (error) {
    console.error("GET DRIVER TRIPS ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching driver trips",
      error: error.message,
    });
  }
};

exports.getTripById = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        r.*,
        u.name AS passenger_name,
        u.phone AS passenger_phone
      FROM rides r
      INNER JOIN users u ON r.passenger_id = u.id
      WHERE r.id = $1 AND r.driver_id = $2
      LIMIT 1
      `,
      [Number(id), userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    return res.status(200).json({
      ride: result.rows[0],
    });
  } catch (error) {
    console.error("GET DRIVER TRIP BY ID ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching trip details",
      error: error.message,
    });
  }
};

exports.updateRideStatus = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["ongoing", "completed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid ride status",
      });
    }

    const existingRide = await pool.query(
      `
      SELECT *
      FROM rides
      WHERE id = $1 AND driver_id = $2
      LIMIT 1
      `,
      [Number(id), userId]
    );

    if (existingRide.rows.length === 0) {
      return res.status(404).json({
        message: "Ride not found",
      });
    }

    const ride = existingRide.rows[0];

    if (status === "ongoing" && ride.status !== "accepted") {
      return res.status(400).json({
        message: "Only accepted rides can be started",
      });
    }

    if (status === "completed" && ride.status !== "ongoing") {
      return res.status(400).json({
        message: "Only ongoing rides can be completed",
      });
    }

    if (status === "completed") {
      const fare = Number(ride.price || 0);

      const passengerWalletCheck = await pool.query(
        `
        SELECT balance
        FROM wallets
        WHERE user_id = $1
        LIMIT 1
        `,
        [ride.passenger_id]
      );

      const passengerBalance = Number(
        passengerWalletCheck.rows[0]?.balance || 0
      );

      if (passengerBalance < fare) {
        return res.status(400).json({
          message: "Passenger has insufficient wallet balance",
        });
      }
    }

    const result = await pool.query(
      `
      UPDATE rides
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND driver_id = $3
      RETURNING *
      `,
      [status, Number(id), userId]
    );

    const updatedRide = result.rows[0];

    if (status === "ongoing") {
      await pool.query(
        `
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1, $2, $3, $4)
        `,
        [
          updatedRide.passenger_id,
          "Ride started",
          "Your ride is now in progress.",
          "ride",
        ]
      );

      await pool.query(
        `
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1, $2, $3, $4)
        `,
        [
          userId,
          "Trip started",
          `Trip #${updatedRide.id} is now ongoing.`,
          "ride",
        ]
      );
    }

    if (status === "completed") {
      const fare = Number(updatedRide.price || 0);

      await pool.query(
        `
        UPDATE driver_wallets
        SET balance = balance + $1
        WHERE user_id = $2
        `,
        [fare, userId]
      );

      await pool.query(
        `
        UPDATE wallets
        SET balance = balance - $1
        WHERE user_id = $2
        `,
        [fare, updatedRide.passenger_id]
      );

      await pool.query(
        `
        INSERT INTO transactions (user_id, amount, type, status, reference)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [userId, fare, "credit", "success", `TRIP-${updatedRide.id}`]
      );

      await pool.query(
        `
        INSERT INTO transactions (user_id, amount, type, status, reference)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          updatedRide.passenger_id,
          fare,
          "debit",
          "success",
          `RIDE-${updatedRide.id}`,
        ]
      );

      await pool.query(
        `
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1, $2, $3, $4)
        `,
        [
          updatedRide.passenger_id,
          "Ride completed",
          `Your ride has been completed. ₦${fare.toLocaleString()} was deducted from your wallet.`,
          "ride",
        ]
      );

      await pool.query(
        `
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1, $2, $3, $4)
        `,
        [
          userId,
          "Trip completed",
          `Trip #${updatedRide.id} completed successfully. ₦${fare.toLocaleString()} added to your wallet.`,
          "ride",
        ]
      );
    }

    if (status === "cancelled") {
      await pool.query(
        `
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1, $2, $3, $4)
        `,
        [
          updatedRide.passenger_id,
          "Ride cancelled",
          "Your ride was cancelled by the driver.",
          "ride",
        ]
      );

      await pool.query(
        `
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1, $2, $3, $4)
        `,
        [
          userId,
          "Trip cancelled",
          `Trip #${updatedRide.id} was cancelled.`,
          "ride",
        ]
      );
    }

    const io = getIO();

    io.to(`passenger:${updatedRide.passenger_id}`).emit("ride:statusChanged", {
      ride: updatedRide,
    });

    io.to(`driver:${userId}`).emit("ride:statusChanged", {
      ride: updatedRide,
    });

    io.to("drivers:lobby").emit("ride:statusChanged", {
      ride: updatedRide,
    });

    return res.status(200).json({
      message: "Ride status updated successfully",
      ride: updatedRide,
    });
  } catch (error) {
    console.error("UPDATE DRIVER RIDE STATUS ERROR:", error);
    return res.status(500).json({
      message: "Server error while updating ride status",
      error: error.message,
    });
  }
};

exports.getWallet = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const walletResult = await pool.query(
      `
      SELECT balance
      FROM driver_wallets
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    const txResult = await pool.query(
      `
      SELECT id, amount, type, status, reference, created_at
      FROM transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return res.status(200).json({
      wallet: walletResult.rows[0] || { balance: 0 },
      transactions: txResult.rows || [],
    });
  } catch (error) {
    console.error("GET DRIVER WALLET ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching driver wallet",
      error: error.message,
    });
  }
};

exports.withdrawWallet = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const amount = Number(req.body.amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Valid withdrawal amount is required",
      });
    }

    const walletResult = await pool.query(
      `
      SELECT balance
      FROM driver_wallets
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    const balance = Number(walletResult.rows[0]?.balance || 0);

    if (amount > balance) {
      return res.status(400).json({
        message: "Insufficient wallet balance",
      });
    }

    const updated = await pool.query(
      `
      UPDATE driver_wallets
      SET balance = balance - $1
      WHERE user_id = $2
      RETURNING balance
      `,
      [amount, userId]
    );

    await pool.query(
      `
      INSERT INTO transactions (user_id, amount, type, status, reference)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        userId,
        amount,
        "debit",
        "success",
        `WITHDRAW-${Date.now()}`,
      ]
    );

    await pool.query(
      `
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, $2, $3, $4)
      `,
      [
        userId,
        "Withdrawal processed",
        `₦${amount.toLocaleString()} was withdrawn from your wallet.`,
        "wallet",
      ]
    );

    return res.status(200).json({
      message: "Withdrawal successful",
      wallet: updated.rows[0],
    });
  } catch (error) {
    console.error("WITHDRAW DRIVER WALLET ERROR:", error);
    return res.status(500).json({
      message: "Server error while withdrawing funds",
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
      notifications: result.rows || [],
    });
  } catch (error) {
    console.error("GET DRIVER NOTIFICATIONS ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching notifications",
      error: error.message,
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = Number(req.user.id);

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
      WHERE u.id = $1
      LIMIT 1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    return res.status(200).json({
      profile: result.rows[0],
    });
  } catch (error) {
    console.error("GET DRIVER PROFILE ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching profile",
      error: error.message,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const {
      vehicle_model,
      plate_number,
      vehicle_color,
      is_online,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO driver_profiles (
        user_id,
        vehicle_model,
        plate_number,
        vehicle_color,
        is_online
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id)
      DO UPDATE SET
        vehicle_model = EXCLUDED.vehicle_model,
        plate_number = EXCLUDED.plate_number,
        vehicle_color = EXCLUDED.vehicle_color,
        is_online = EXCLUDED.is_online,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
      `,
      [
        userId,
        vehicle_model || "",
        plate_number || "",
        vehicle_color || "",
        !!is_online,
      ]
    );

    return res.status(200).json({
      message: "Profile updated successfully",
      profile: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE DRIVER PROFILE ERROR:", error);
    return res.status(500).json({
      message: "Server error while updating profile",
      error: error.message,
    });
  }
};