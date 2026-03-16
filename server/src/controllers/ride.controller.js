const pool = require("../config/db");
const { getIO } = require("../socket");

exports.requestRide = async (req, res) => {
  try {
    const {
      passenger_id,
      pickup,
      destination,
      dropoff,
      ride_type,
      payment_method,
      note,
      pickup_lat,
      pickup_lng,
      dropoff_lat,
      dropoff_lng,
    } = req.body;

    const finalDropoff = (dropoff || destination || "").trim();

    if (!passenger_id || !pickup || !finalDropoff) {
      return res.status(400).json({
        message: "passenger_id, pickup and dropoff are required",
      });
    }

    const passengerCheck = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [Number(passenger_id)]
    );

    if (passengerCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Passenger not found",
      });
    }

    const selectedRideType = ride_type || "standard";

    const typeMultiplier =
      selectedRideType === "premium"
        ? 1.7
        : selectedRideType === "comfort"
        ? 1.3
        : 1;

    const textDistanceFactor =
      Math.max(pickup.trim().length, finalDropoff.length) +
      Math.abs(pickup.trim().length - finalDropoff.length);

    const estimatedFare = Math.round(
      (700 + textDistanceFactor * 25) * typeMultiplier
    );

    if ((payment_method || "wallet") === "wallet") {
      const walletResult = await pool.query(
        `
        SELECT balance
        FROM wallets
        WHERE user_id = $1
        LIMIT 1
        `,
        [Number(passenger_id)]
      );

      const walletBalance = Number(walletResult.rows[0]?.balance || 0);

      if (walletBalance < estimatedFare) {
        return res.status(400).json({
          message: `Insufficient wallet balance. You need ₦${estimatedFare.toLocaleString()} but your wallet has ₦${walletBalance.toLocaleString()}.`,
        });
      }
    }

    const rideResult = await pool.query(
      `
      INSERT INTO rides (
        passenger_id,
        pickup,
        dropoff,
        ride_type,
        payment_method,
        note,
        status,
        price,
        pickup_lat,
        pickup_lng,
        dropoff_lat,
        dropoff_lng,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *
      `,
      [
        Number(passenger_id),
        pickup.trim(),
        finalDropoff,
        selectedRideType,
        payment_method || "wallet",
        note ? note.trim() : null,
        "pending",
        estimatedFare,
        pickup_lat ?? null,
        pickup_lng ?? null,
        dropoff_lat ?? null,
        dropoff_lng ?? null,
      ]
    );

    const ride = rideResult.rows[0];
    const io = getIO();

    io.to("drivers:lobby").emit("ride:new", { ride });

    return res.status(201).json({
      message: "Ride request created successfully",
      ride,
    });
  } catch (error) {
    console.error("REQUEST RIDE ERROR:", error);
    return res.status(500).json({
      message: "Server error while creating ride request",
      error: error.message,
    });
  }
};

exports.getPassengerRides = async (req, res) => {
  try {
    const { passengerId } = req.params;

    const result = await pool.query(
      `
      SELECT
        r.id,
        r.pickup,
        r.dropoff,
        r.status,
        r.price,
        r.created_at,
        u.name AS driver_name
      FROM rides r
      LEFT JOIN users u ON r.driver_id = u.id
      WHERE r.passenger_id = $1
      ORDER BY r.created_at DESC
      `,
      [Number(passengerId)]
    );

    return res.status(200).json({
      rides: result.rows,
    });
  } catch (error) {
    console.error("GET PASSENGER RIDES ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching passenger rides",
      error: error.message,
    });
  }
};

exports.getRideById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        r.id,
        r.pickup,
        r.dropoff,
        r.status,
        r.price,
        r.created_at,
        r.payment_method,
        r.note,
        r.pickup_lat,
        r.pickup_lng,
        r.dropoff_lat,
        r.dropoff_lng,
        u.name AS driver_name,
        u.phone AS driver_phone,
        u.photo AS driver_photo,
        dp.vehicle_model,
        dp.vehicle_color,
        dp.plate_number
      FROM rides r
      LEFT JOIN users u ON r.driver_id = u.id
      LEFT JOIN driver_profiles dp ON dp.user_id = u.id
      WHERE r.id = $1
      LIMIT 1
      `,
      [Number(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Ride not found",
      });
    }

    return res.status(200).json({
      ride: result.rows[0],
    });
  } catch (error) {
    console.error("GET RIDE BY ID ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching ride",
      error: error.message,
    });
  }
};

exports.cancelRide = async (req, res) => {
  try {
    const { id } = req.params;
    const passengerId = Number(req.user.id);

    const existingRide = await pool.query(
      `
      SELECT *
      FROM rides
      WHERE id = $1 AND passenger_id = $2
      LIMIT 1
      `,
      [Number(id), passengerId]
    );

    if (existingRide.rows.length === 0) {
      return res.status(404).json({
        message: "Ride not found",
      });
    }

    const ride = existingRide.rows[0];

    if (!["pending", "accepted"].includes(ride.status)) {
      return res.status(400).json({
        message: "Only pending or accepted rides can be cancelled",
      });
    }

    const result = await pool.query(
      `
      UPDATE rides
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [Number(id)]
    );

    const updatedRide = result.rows[0];

    await pool.query(
      `
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, $2, $3, $4)
      `,
      [
        passengerId,
        "Ride cancelled",
        `You cancelled ride #${updatedRide.id}.`,
        "ride",
      ]
    );

    if (updatedRide.driver_id) {
      await pool.query(
        `
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1, $2, $3, $4)
        `,
        [
          updatedRide.driver_id,
          "Ride cancelled",
          `Passenger cancelled ride #${updatedRide.id}.`,
          "ride",
        ]
      );
    }

    const io = getIO();

    io.to(`passenger:${updatedRide.passenger_id}`).emit("ride:statusChanged", {
      ride: updatedRide,
    });

    if (updatedRide.driver_id) {
      io.to(`driver:${updatedRide.driver_id}`).emit("ride:statusChanged", {
        ride: updatedRide,
      });
    }

    io.to("drivers:lobby").emit("ride:statusChanged", {
      ride: updatedRide,
    });

    return res.status(200).json({
      message: "Ride cancelled successfully",
      ride: updatedRide,
    });
  } catch (error) {
    console.error("CANCEL RIDE ERROR:", error);
    return res.status(500).json({
      message: "Server error while cancelling ride",
      error: error.message,
    });
  }
};

exports.getAvailableRides = async (req, res) => {
  try {
    const driverId = Number(req.user.id);

    const driverProfile = await pool.query(
      `
      SELECT is_online
      FROM driver_profiles
      WHERE user_id = $1
      LIMIT 1
      `,
      [driverId]
    );

    if (driverProfile.rows.length === 0 || !driverProfile.rows[0].is_online) {
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
      WHERE r.status = 'pending'
        AND r.driver_id IS NULL
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
    const { id } = req.params;
    const { driver_id } = req.body;

    if (!driver_id) {
      return res.status(400).json({
        message: "driver_id is required",
      });
    }

    const driverCheck = await pool.query(
      `
      SELECT u.id, u.name, u.role, dp.is_online
      FROM users u
      LEFT JOIN driver_profiles dp ON dp.user_id = u.id
      WHERE u.id = $1
      `,
      [Number(driver_id)]
    );

    if (driverCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    if (!driverCheck.rows[0].is_online) {
      return res.status(400).json({
        message: "Driver must be online before accepting rides",
      });
    }

    const updatedRide = await pool.query(
      `
      UPDATE rides
      SET
        driver_id = $1,
        status = 'accepted',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
        AND driver_id IS NULL
        AND status = 'pending'
      RETURNING *
      `,
      [Number(driver_id), Number(id)]
    );

    if (updatedRide.rows.length === 0) {
      return res.status(400).json({
        message: "Ride is no longer available",
      });
    }

    const ride = updatedRide.rows[0];
    const io = getIO();

    io.to(`passenger:${ride.passenger_id}`).emit("ride:accepted", {
      ride,
    });

    io.to("drivers:lobby").emit("ride:removed", {
      rideId: ride.id,
    });

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

    return res.status(200).json({
      message: "Ride accepted successfully",
      ride,
    });
  } catch (error) {
    console.error("ACCEPT RIDE ERROR:", error);
    return res.status(500).json({
      message: "Server error while accepting ride",
      error: error.message,
    });
  }
};

exports.updateRideStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "accepted",
      "ongoing",
      "completed",
      "cancelled",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Valid status is required",
      });
    }

    const result = await pool.query(
      `
      UPDATE rides
      SET
        status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [status, Number(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Ride not found",
      });
    }

    const ride = result.rows[0];
    const io = getIO();

    io.to(`passenger:${ride.passenger_id}`).emit("ride:statusChanged", {
      ride,
    });

    if (ride.driver_id) {
      io.to(`driver:${ride.driver_id}`).emit("ride:statusChanged", {
        ride,
      });
    }

    return res.status(200).json({
      message: "Ride status updated successfully",
      ride,
    });
  } catch (error) {
    console.error("UPDATE RIDE STATUS ERROR:", error);
    return res.status(500).json({
      message: "Server error while updating ride status",
      error: error.message,
    });
  }
};

exports.getDriverRides = async (req, res) => {
  try {
    const { driverId } = req.params;

    const result = await pool.query(
      `
      SELECT
        r.*,
        u.name AS passenger_name
      FROM rides r
      INNER JOIN users u ON r.passenger_id = u.id
      WHERE r.driver_id = $1
      ORDER BY r.created_at DESC
      `,
      [Number(driverId)]
    );

    return res.status(200).json({
      rides: result.rows,
    });
  } catch (error) {
    console.error("GET DRIVER RIDES ERROR:", error);
    return res.status(500).json({
      message: "Server error while fetching driver rides",
      error: error.message,
    });
  }
};