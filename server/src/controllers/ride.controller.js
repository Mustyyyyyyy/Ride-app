const pool = require("../config/db");
const { getIO } = require("../socket");

function isWithinOgbomoso(lat, lng) {
  return lat >= 7.95 && lat <= 8.30 && lng >= 4.10 && lng <= 4.40;
}


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
      "SELECT id FROM users WHERE id = $1",
      [Number(passenger_id)]
    );

    if (passengerCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Passenger not found",
      });
    }


    const hasCoords =
      pickup_lat != null &&
      pickup_lng != null &&
      dropoff_lat != null &&
      dropoff_lng != null;

    if (hasCoords) {
      const pickupOk = isWithinOgbomoso(
        Number(pickup_lat),
        Number(pickup_lng)
      );

      const dropoffOk = isWithinOgbomoso(
        Number(dropoff_lat),
        Number(dropoff_lng)
      );

      if (!pickupOk || !dropoffOk) {
        return res.status(400).json({
          message: "Only Ogbomoso locations are allowed",
        });
      }
    }

    const selectedRideType = ride_type || "standard";

    const typeMultiplier =
      selectedRideType === "premium"
        ? 1.7
        : selectedRideType === "comfort"
        ? 1.3
        : 1;

    const textDistanceFactor =
      Math.max(pickup.length, finalDropoff.length) +
      Math.abs(pickup.length - finalDropoff.length);

    const estimatedFare = Math.round(
      (700 + textDistanceFactor * 25) * typeMultiplier
    );

    if ((payment_method || "wallet") === "wallet") {
      const walletResult = await pool.query(
        "SELECT balance FROM wallets WHERE user_id = $1 LIMIT 1",
        [Number(passenger_id)]
      );

      const balance = Number(walletResult.rows[0]?.balance || 0);

      if (balance < estimatedFare) {
        return res.status(400).json({
          message: `Insufficient balance. Need ₦${estimatedFare}`,
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
        $1,$2,$3,$4,$5,$6,$7,$8,
        $9,$10,$11,$12,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *
      `,
      [
        Number(passenger_id),
        pickup.trim(),
        finalDropoff,
        selectedRideType,
        payment_method || "wallet",
        note || null,
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
      message: "Ride created successfully",
      ride,
    });
  } catch (error) {
    console.error("REQUEST RIDE ERROR:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};


exports.getPassengerRides = async (req, res) => {
  try {
    const { passengerId } = req.params;

    const result = await pool.query(
      `
      SELECT r.*, u.name AS driver_name
      FROM rides r
      LEFT JOIN users u ON r.driver_id = u.id
      WHERE r.passenger_id = $1
      ORDER BY r.created_at DESC
      `,
      [Number(passengerId)]
    );

    return res.json({ rides: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching rides" });
  }
};


exports.getRideById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT r.*, u.name AS driver_name
      FROM rides r
      LEFT JOIN users u ON r.driver_id = u.id
      WHERE r.id = $1
      `,
      [Number(id)]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Ride not found" });
    }

    return res.json({ ride: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching ride" });
  }
};


exports.cancelRide = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE rides
      SET status = 'cancelled'
      WHERE id = $1
      RETURNING *
      `,
      [Number(id)]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Ride not found" });
    }

    const ride = result.rows[0];

    const io = getIO();
    io.emit("ride:statusChanged", { ride });

    res.json({ message: "Ride cancelled", ride });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error cancelling ride" });
  }
};


exports.getAvailableRides = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT r.*, u.name AS passenger_name
      FROM rides r
      JOIN users u ON r.passenger_id = u.id
      WHERE r.status = 'pending'
      `
    );

    res.json({ rides: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching rides" });
  }
};


exports.acceptRide = async (req, res) => {
  try {
    const { id } = req.params;
    const { driver_id } = req.body;

    const result = await pool.query(
      `
      UPDATE rides
      SET driver_id = $1, status = 'accepted'
      WHERE id = $2 AND status = 'pending'
      RETURNING *
      `,
      [driver_id, id]
    );

    if (!result.rows.length) {
      return res.status(400).json({ message: "Ride unavailable" });
    }

    const ride = result.rows[0];

    const io = getIO();
    io.emit("ride:accepted", { ride });

    res.json({ message: "Ride accepted", ride });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error accepting ride" });
  }
};


exports.updateRideStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `
      UPDATE rides
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Ride not found" });
    }

    const ride = result.rows[0];

    const io = getIO();
    io.emit("ride:statusChanged", { ride });

    res.json({ message: "Status updated", ride });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating status" });
  }
};

exports.getDriverRides = async (req, res) => {
  try {
    const { driverId } = req.params;

    const result = await pool.query(
      `
      SELECT r.*, u.name AS passenger_name
      FROM rides r
      JOIN users u ON r.passenger_id = u.id
      WHERE r.driver_id = $1
      `,
      [driverId]
    );

    res.json({ rides: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching rides" });
  }
};