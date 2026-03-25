const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const driverController = require("../controllers/driver.controller");

router.get("/dashboard", authMiddleware, driverController.getDashboard);
router.get("/available-rides", authMiddleware, driverController.getAvailableRides);
router.post("/rides/:id/accept", authMiddleware, driverController.acceptRide);

router.get("/trips", authMiddleware, driverController.getMyTrips);
router.get("/trips/:id", authMiddleware, driverController.getTripById);
router.patch("/rides/:id/status", authMiddleware, driverController.updateRideStatus);

router.get("/wallet", authMiddleware, driverController.getWallet);
router.post("/wallet/withdraw", authMiddleware, driverController.withdrawWallet);

router.get("/notifications", authMiddleware, driverController.getNotifications);

router.get("/profile", authMiddleware, driverController.getProfile);
router.put("/profile", authMiddleware, driverController.updateProfile);

router.get("/analytics", authMiddleware, driverController.getDriverAnalytics);

module.exports = router;