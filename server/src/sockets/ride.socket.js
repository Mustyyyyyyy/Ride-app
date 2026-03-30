const pool = require("../config/db");

const registerRideSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("joinPassenger", ({ passengerId }) => {
      if (!passengerId) return;
      socket.join(`passenger:${passengerId}`);
    });

    socket.on("joinDriver", async ({ driverId }) => {
      if (!driverId) return;

      socket.join(`driver:${driverId}`);

      try {
        const profileResult = await pool.query(
          `
          SELECT ride_categories
          FROM driver_profiles
          WHERE user_id = $1
          LIMIT 1
          `,
          [Number(driverId)]
        );

        const categories = profileResult.rows[0]?.ride_categories || ["standard"];

        categories.forEach((category) => {
          socket.join(`drivers:${category}`);
        });
      } catch (error) {
        console.error("JOIN DRIVER CATEGORY ERROR:", error);
      }
    });

    socket.on("updateDriverCategories", ({ categories }) => {
      const allowedCategories = ["standard", "comfort", "premium"];

      // leave old known category rooms first
      allowedCategories.forEach((category) => {
        socket.leave(`drivers:${category}`);
      });

      if (!Array.isArray(categories)) return;

      categories
        .filter((category) => allowedCategories.includes(category))
        .forEach((category) => {
          socket.join(`drivers:${category}`);
        });
    });

    socket.on("joinRideRoom", ({ rideId }) => {
      if (!rideId) return;
      socket.join(`ride:${rideId}`);
    });

    socket.on("newRideRequest", async ({ rideId }) => {
      if (!rideId) return;

      try {
        const result = await pool.query(
          `SELECT * FROM rides WHERE id = $1 LIMIT 1`,
          [Number(rideId)]
        );

        if (!result.rows.length) return;

        const ride = result.rows[0];
        const rideType = ride.ride_type || "standard";

        io.to(`drivers:${rideType}`).emit("newRideRequest", {
          message: "New ride request available",
          ride,
        });
      } catch (error) {
        console.error("NEW RIDE REQUEST SOCKET ERROR:", error);
      }
    });

    socket.on("rideAccepted", async ({ rideId }) => {
      if (!rideId) return;

      try {
        const result = await pool.query(
          `SELECT * FROM rides WHERE id = $1 LIMIT 1`,
          [Number(rideId)]
        );

        if (!result.rows.length) return;

        const ride = result.rows[0];
        const rideType = ride.ride_type || "standard";

        io.to(`passenger:${ride.passenger_id}`).emit("rideAccepted", {
          message: "Your ride has been accepted",
          ride,
        });

        if (ride.driver_id) {
          io.to(`driver:${ride.driver_id}`).emit("rideAccepted", {
            message: "Ride accepted",
            ride,
          });
        }

        io.to(`ride:${ride.id}`).emit("rideAccepted", {
          message: "Ride accepted",
          ride,
        });

        io.to(`drivers:${rideType}`).emit("rideRemoved", {
          rideId: ride.id,
        });
      } catch (error) {
        console.error("RIDE ACCEPTED SOCKET ERROR:", error);
      }
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

      try {
        const result = await pool.query(
          `SELECT * FROM rides WHERE id = $1 LIMIT 1`,
          [Number(rideId)]
        );

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
      } catch (error) {
        console.error("RIDE COMPLETED SOCKET ERROR:", error);
      }
    });

    socket.on("rideCancelled", async ({ rideId }) => {
      if (!rideId) return;

      try {
        const result = await pool.query(
          `SELECT * FROM rides WHERE id = $1 LIMIT 1`,
          [Number(rideId)]
        );

        if (!result.rows.length) return;

        const ride = result.rows[0];

        io.to(`passenger:${ride.passenger_id}`).emit("rideCancelled", {
          message: "Your ride has been cancelled",
          ride,
        });

        if (ride.driver_id) {
          io.to(`driver:${ride.driver_id}`).emit("rideCancelled", {
            message: "Ride cancelled",
            ride,
          });
        }

        io.to(`ride:${ride.id}`).emit("rideCancelled", {
          message: "Ride cancelled",
          ride,
        });
      } catch (error) {
        console.error("RIDE CANCELLED SOCKET ERROR:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};

module.exports = registerRideSocket;