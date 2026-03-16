const express = require("express");
const router = express.Router();

const rideController = require("../controllers/ride.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/request", authMiddleware, rideController.requestRide);

router.get("/passenger/:passengerId", authMiddleware, rideController.getPassengerRides);
router.get("/driver/:driverId", authMiddleware, rideController.getDriverRides);
router.get("/available/list", authMiddleware, rideController.getAvailableRides);
router.get("/:id", authMiddleware, rideController.getRideById);

router.patch("/:id/accept", authMiddleware, rideController.acceptRide);
router.patch("/:id/status", authMiddleware, rideController.updateRideStatus);
router.patch("/:id/cancel", authMiddleware, rideController.cancelRide);


module.exports = router;