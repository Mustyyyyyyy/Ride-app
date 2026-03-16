const { Server } = require("socket.io");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "https://ride-app-brown.vercel.app",
      ],
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("joinPassengerRoom", (passengerId) => {
      if (!passengerId) return;
      socket.join(`passenger:${passengerId}`);
    });

    socket.on("joinDriverRoom", (driverId) => {
      if (!driverId) return;
      socket.join(`driver:${driverId}`);
    });

    socket.on("joinRideRoom", (rideId) => {
      if (!rideId) return;
      socket.join(`ride:${rideId}`);
    });

    socket.on("joinDriversLobby", () => {
      socket.join("drivers:lobby");
    });

    socket.on("leaveDriversLobby", () => {
      socket.leave("drivers:lobby");
    });

    socket.on("driver:location", (data) => {
      if (!data?.rideId || data?.lat == null || data?.lng == null) return;

      io.to(`ride:${data.rideId}`).emit("driver:locationUpdate", {
        rideId: data.rideId,
        driverId: data.driverId,
        lat: Number(data.lat),
        lng: Number(data.lng),
        updatedAt: new Date().toISOString(),
      });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

module.exports = { initSocket, getIO };