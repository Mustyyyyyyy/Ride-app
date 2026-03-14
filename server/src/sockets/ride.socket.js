const pool = require("../config/db");

const registerRideSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("joinPassenger", ({ passengerId }) => {
      if (!passengerId) return;
      socket.join(`passenger:${passengerId}`);
    });

    socket.on("joinDriver", ({ driverId }) => {
      if (!driverId) return;
      socket.join(`driver:${driverId}`);
      socket.join("drivers");
    });

    socket.on("joinRideRoom", ({ rideId }) => {
      if (!rideId) return;
      socket.join(`ride:${rideId}`);
    });

    socket.on("newRideRequest", async ({ rideId }) => {
      if (!rideId) return;
      const result = await pool.query(`SELECT * FROM rides WHERE id = $1`, [rideId]);
      if (!result.rows.length) return;

      io.to("drivers").emit("newRideRequest", {
        message: "New ride request available",
        ride: result.rows[0],
      });
    });

    socket.on("rideAccepted", async ({ rideId }) => {
      if (!rideId) return;
      const result = await pool.query(`SELECT * FROM rides WHERE id = $1`, [rideId]);
      if (!result.rows.length) return;

      const ride = result.rows[0];

      io.to(`passenger:${ride.passenger_id}`).emit("rideAccepted", {
        message: "Your ride has been accepted",
        ride,
      });

      io.to(`ride:${ride.id}`).emit("rideAccepted", {
        message: "Ride accepted",
        ride,
      });
    });

    socket.on("driverLocationUpdate", ({ rideId, driverId, lat, lng }) => {
      if (!rideId) return;
      io.to(`ride:${rideId}`).emit("driverLocationUpdate", {
        rideId,
        driverId,
        lat,
        lng,
      });
    });

    socket.on("rideCompleted", async ({ rideId }) => {
      if (!rideId) return;
      const result = await pool.query(`SELECT * FROM rides WHERE id = $1`, [rideId]);
      if (!result.rows.length) return;

      const ride = result.rows[0];

      io.to(`passenger:${ride.passenger_id}`).emit("rideCompleted", {
        message: "Your ride has been completed",
        ride,
      });

      if (ride.driver_id) {
        io.to(`driver:${ride.driver_id}`).emit("rideCompleted", {
          message: "Ride completed successfully",
          ride,
        });
      }

      io.to(`ride:${ride.id}`).emit("rideCompleted", {
        message: "Ride completed",
        ride,
      });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};

module.exports = registerRideSocket;