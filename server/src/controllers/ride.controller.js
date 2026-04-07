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

    const allowedRideTypes = ["standard", "comfort", "premium"];
    if (!allowedRideTypes.includes(selectedRideType)) {
      return res.status(400).json({
        message: "Invalid ride type selected",
      });
    }

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
        fare,
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

    // Notify only drivers in the selected category room
    io.to(`drivers:${selectedRideType}`).emit("ride:new", { ride });

    return res.status(201).json({
      message: "Ride created successfully",
      ride,
    });
  } catch (error) {
    console.error("REQUEST RIDE ERROR:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
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
    console.error("GET PASSENGER RIDES ERROR:", error);
    res.status(500).json({ message: "Error fetching rides" });
  }
};

exports.getRideById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        r.*,
        u.name AS driver_name,
        u.phone AS driver_phone,
        dp.vehicle_model AS vehicleModel,
        dp.vehicle_type AS vehicleType,
        dp.vehicle_brand AS vehicleBrand,
        dp.plate_number AS plateNumber,
        dp.vehicle_image AS vehicleImage
      FROM rides r
      LEFT JOIN users u ON r.driver_id = u.id
      LEFT JOIN driver_profiles dp ON dp.user_id = u.id
      WHERE r.id = $1
      LIMIT 1
      `,
      [Number(id)]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Ride not found" });
    }

    return res.json({ ride: result.rows[0] });
  } catch (error) {
    console.error("GET RIDE BY ID ERROR:", error);
    res.status(500).json({ message: "Error fetching ride" });
  }
};

exports.cancelRide = async (req, res) => {
  try {
    const passengerId = req.user.id;
    const { id } = req.params;

    const existingRide = await pool.query(
      `
      SELECT *
      FROM rides
      WHERE id = $1 AND passenger_id = $2
      LIMIT 1
      `,
      [Number(id), passengerId]
    );

    if (!existingRide.rows.length) {
      return res.status(404).json({ message: "Ride not found" });
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

    const io = getIO();

    io.to(`passenger:${updatedRide.passenger_id}`).emit("ride:statusChanged", {
      ride: updatedRide,
    });

    if (updatedRide.driver_id) {
      io.to(`driver:${updatedRide.driver_id}`).emit("ride:statusChanged", {
        ride: updatedRide,
      });
    }

    io.to(`drivers:${updatedRide.ride_type}`).emit("ride:statusChanged", {
      ride: updatedRide,
    });

    res.json({ message: "Ride cancelled", ride: updatedRide });
  } catch (error) {
    console.error("CANCEL RIDE ERROR:", error);
    res.status(500).json({ message: "Error cancelling ride" });
  }
};

exports.getAvailableRides = async (req, res) => {
  try {
    const driverId = req.user.id;

    const profileResult = await pool.query(
      `
      SELECT is_online AS isOnline
      FROM driver_profiles
      WHERE user_id = $1
      LIMIT 1
      `,
      [driverId]
    );

    if (
      !profileResult.rows.length ||
      !profileResult.rows[0].isOnline
    ) {
      return res.json({ rides: [] });
    }

    const categories = ["standard"];

    const result = await pool.query(
      `
      SELECT r.*, u.name AS passenger_name
      FROM rides r
      JOIN users u ON r.passenger_id = u.id
      WHERE r.status = 'pending'
      AND r.driver_id IS NULL
      AND r.ride_type = ANY($1::text[])
      ORDER BY r.created_at DESC
      `,
      [categories]
    );

    res.json({ rides: result.rows });
  } catch (error) {
    console.error("GET AVAILABLE RIDES ERROR:", error);
    res.status(500).json({ message: "Error fetching rides" });
  }
};

exports.acceptRide = async (req, res) => {
  try {
    const { id } = req.params;
    const { driver_id } = req.body;

    const driverId = Number(driver_id);

    const profileResult = await pool.query(
      `
      SELECT is_online AS isOnline
      FROM driver_profiles
      WHERE user_id = $1
      LIMIT 1
      `,
      [driverId]
    );

    if (
      !profileResult.rows.length ||
      !profileResult.rows[0].isOnline
    ) {
      return res.status(400).json({
        message: "Driver must be online to accept rides",
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

    if (!rideCheck.rows.length) {
      return res.status(404).json({ message: "Ride not found" });
    }

    const rideToAccept = rideCheck.rows[0];
    const categories = ["standard"];

    if (!categories.includes(rideToAccept.ride_type)) {
      return res.status(400).json({
        message: "Driver category does not match this ride type",
      });
    }

    const result = await pool.query(
      `
      UPDATE rides
      SET driver_id = $1, status = 'accepted', updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND status = 'pending' AND driver_id IS NULL
      RETURNING *
      `,
      [driverId, Number(id)]
    );

    if (!result.rows.length) {
      return res.status(400).json({ message: "Ride unavailable" });
    }

    const ride = result.rows[0];

    const io = getIO();

    io.to(`passenger:${ride.passenger_id}`).emit("ride:accepted", { ride });
    io.to(`driver:${driverId}`).emit("ride:accepted", { ride });
    io.to(`drivers:${ride.ride_type}`).emit("ride:removed", { rideId: ride.id });

    res.json({ message: "Ride accepted", ride });
  } catch (error) {
    console.error("ACCEPT RIDE ERROR:", error);
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
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [status, Number(id)]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Ride not found" });
    }

    const ride = result.rows[0];

    const io = getIO();

    io.to(`passenger:${ride.passenger_id}`).emit("ride:statusChanged", { ride });

    if (ride.driver_id) {
      io.to(`driver:${ride.driver_id}`).emit("ride:statusChanged", { ride });
    }

    io.to(`drivers:${ride.ride_type}`).emit("ride:statusChanged", { ride });

    res.json({ message: "Status updated", ride });
  } catch (error) {
    console.error("UPDATE RIDE STATUS ERROR:", error);
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
      ORDER BY r.created_at DESC
      `,
      [Number(driverId)]
    );

    res.json({ rides: result.rows });
  } catch (error) {
    console.error("GET DRIVER RIDES ERROR:", error);
    res.status(500).json({ message: "Error fetching rides" });
  }
};