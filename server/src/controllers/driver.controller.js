const pool = require("../config/db");
const { getIO } = require("../socket");
const cloudinary = require("../config/cloudinary");


exports.getDashboard = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const [
      ridesResult,
      walletResult,
      profileResult,
      notificationsResult,
      todayEarningsResult,
    ] = await Promise.all([
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
        SELECT
          vehicle_model,
          plate_number,
          vehicle_color,
          vehicle_image,
          ride_categories,
          is_online
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
      pool.query(
        `
        SELECT COALESCE(SUM(price), 0)::int AS today_earnings
        FROM rides
        WHERE driver_id = $1
        AND status = 'completed'
        AND DATE(created_at) = CURRENT_DATE
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
        today_earnings: Number(
          todayEarningsResult.rows[0]?.today_earnings || 0
        ),
      },
      wallet: walletResult.rows[0] || { balance: 0 },
      profile:
        profileResult.rows[0] || {
          vehicle_model: "",
          plate_number: "",
          vehicle_color: "",
          vehicle_image: "",
          ride_categories: ["standard"],
          is_online: false,
        },
      notifications: notificationsResult.rows || [],
      recentRides: rides.slice(0, 7),
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
      SELECT is_online, ride_categories
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

    const categories = profileCheck.rows[0].ride_categories || ["standard"];

    const result = await pool.query(
      `
      SELECT
        r.*,
        u.name AS passenger_name
      FROM rides r
      INNER JOIN users u ON r.passenger_id = u.id
      WHERE r.driver_id IS NULL
      AND r.status = 'pending'
      AND r.ride_type = ANY($1::text[])
      ORDER BY r.created_at DESC
      `,
      [categories]
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
      SELECT is_online, ride_categories
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

    const rideCheck = await pool.query(
      `
      SELECT *
      FROM rides
      WHERE id = $1
      LIMIT 1
      `,
      [Number(id)]
    );

    if (rideCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Ride not found",
      });
    }

    const rideToAccept = rideCheck.rows[0];
    const categories = profileCheck.rows[0].ride_categories || ["standard"];

    if (!categories.includes(rideToAccept.ride_type)) {
      return res.status(400).json({
        message: "Your vehicle category does not match this ride type",
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
    io.to(`drivers:${ride.ride_type}`).emit("ride:removed", { rideId: ride.id });

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

    if (!id || Number.isNaN(Number(id))) {
      return res.status(400).json({
        message: "Invalid trip ID",
      });
    }

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

    const paymentMethod = ride.payment_method || "wallet";

    if (status === "completed" && paymentMethod === "wallet") {
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

      if (passengerBalance < ride.price) {
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

      if (paymentMethod === "wallet") {

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
            `₦${fare.toLocaleString()} was deducted from your wallet.`,
            "ride",
          ]
        );
      }

      if (paymentMethod === "cash") {

        await pool.query(
          `
          INSERT INTO notifications (user_id, title, message, type)
          VALUES ($1, $2, $3, $4)
          `,
          [
            updatedRide.passenger_id,
            "Ride completed",
            `Please pay ₦${fare.toLocaleString()} to the driver in cash.`,
            "ride",
          ]
        );
      }

      await pool.query(
        `
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1, $2, $3, $4)
        `,
        [
          userId,
          "Trip completed",
          `Trip #${updatedRide.id} completed successfully.`,
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

    io.to(`drivers:${updatedRide.ride_type}`).emit("ride:statusChanged", {
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
    dp.vehicle_image,
    dp.ride_categories,
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
      vehicle_image,
      ride_categories,
      is_online,
    } = req.body;

    const allowedCategories = ["standard", "comfort", "premium"];

    const safeCategories = Array.isArray(ride_categories)
      ? ride_categories.filter((item) => allowedCategories.includes(item))
      : ["standard"];

    const result = await pool.query(
      `
      INSERT INTO driver_profiles (
        user_id,
        vehicle_model,
        plate_number,
        vehicle_color,
        vehicle_image,
        ride_categories,
        is_online
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id)
      DO UPDATE SET
        vehicle_model = EXCLUDED.vehicle_model,
        plate_number = EXCLUDED.plate_number,
        vehicle_color = EXCLUDED.vehicle_color,
        vehicle_image = EXCLUDED.vehicle_image,
        ride_categories = EXCLUDED.ride_categories,
        is_online = EXCLUDED.is_online,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
      `,
      [
        userId,
        vehicle_model || "",
        plate_number || "",
        vehicle_color || "",
        vehicle_image || "",
        safeCategories,
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

exports.getDriverAnalytics = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const result = await pool.query(
      `
      SELECT
        TO_CHAR(created_at, 'Dy') AS day,
        COALESCE(SUM(price), 0)::int AS earnings
      FROM rides
      WHERE driver_id = $1
      AND status = 'completed'
      AND created_at >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY DATE(created_at), TO_CHAR(created_at, 'Dy')
      ORDER BY DATE(created_at) ASC
      `,
      [userId]
    );

    const dayMap = new Map();
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((day) => {
      dayMap.set(day, 0);
    });

    for (const row of result.rows || []) {
      dayMap.set(String(row.day).trim(), Number(row.earnings || 0));
    }

    return res.status(200).json({
      trend: Array.from(dayMap.entries()).map(([day, earnings]) => ({
        day,
        earnings,
      })),
    });
  } catch (error) {
    console.error("GET DRIVER ANALYTICS ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching driver analytics",
      error: error.message,
    });
  }
};


exports.uploadVehicleImage = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    if (!req.file) {
      return res.status(400).json({
        message: "Vehicle image file is required",
      });
    }

    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const uploaded = await cloudinary.uploader.upload(base64, {
      folder: "oride/drivers",
      resource_type: "image",
    });

    await pool.query(
      `
      INSERT INTO driver_profiles (user_id, vehicle_image)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET
        vehicle_image = EXCLUDED.vehicle_image,
        updated_at = CURRENT_TIMESTAMP
      `,
      [userId, uploaded.secure_url]
    );

    return res.status(200).json({
      message: "Vehicle image uploaded successfully",
      vehicle_image: uploaded.secure_url,
    });
  } catch (error) {
    console.error("UPLOAD VEHICLE IMAGE ERROR:", error);
    return res.status(500).json({
      message: "Server error while uploading vehicle image",
      error: error.message,
    });
  }
};