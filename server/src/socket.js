let io;

function initSocket(server) {
  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("joinPassengerRoom", (userId) => {
      socket.join(`passenger:${userId}`);
    });

    socket.on("joinDriverRoom", (userId) => {
      socket.join(`driver:${userId}`);
    });

    socket.on("joinDriversLobby", () => {
      socket.join("drivers:lobby");
    });

    socket.on("leaveDriversLobby", () => {
      socket.leave("drivers:lobby");
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