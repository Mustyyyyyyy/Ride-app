const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const rideRoutes = require("./routes/ride.routes");
const passengerRoutes = require("./routes/passenger.routes");
const driverRoutes = require("./routes/driver.routes");
const paymentRoutes = require("./routes/payment.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://ride-app-brown.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS: " + origin));
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("ORIDE API is running");
});

app.get("/ping", (req, res) => {
  res.send("pong");
});

app.use("/api/auth", authRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/passenger", passengerRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);

module.exports = app;