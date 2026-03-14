const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const rideRoutes = require("./routes/ride.routes");
const passengerRoutes = require("./routes/passenger.routes");
const driverRoutes = require("./routes/driver.routes");
const paymentRoutes = require("./routes/payment.routes");



const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
app.use("/api/payments", paymentRoutes)


module.exports = app;