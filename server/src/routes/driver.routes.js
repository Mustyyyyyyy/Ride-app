const express = require("express");
const router = express.Router();

const driverMiddleware = require("../middleware/driver.middleware");
const driverController = require("../controllers/driver.controller");
const upload = require("../middleware/upload.middleware");

router.get("/dashboard", driverMiddleware, driverController.getDashboard);
router.get("/available-rides", driverMiddleware, driverController.getAvailableRides);
router.post("/rides/:id/accept", driverMiddleware, driverController.acceptRide);

router.get("/trips", driverMiddleware, driverController.getMyTrips);
router.get("/trips/:id", driverMiddleware, driverController.getTripById);
router.patch("/rides/:id/status", driverMiddleware, driverController.updateRideStatus);

router.get("/wallet", driverMiddleware, driverController.getWallet);
router.post("/wallet/withdraw", driverMiddleware, driverController.withdrawWallet);

router.get("/notifications", driverMiddleware, driverController.getNotifications);

router.get("/profile", driverMiddleware, driverController.getProfile);
router.put("/profile", driverMiddleware, driverController.updateProfile);

router.get("/analytics", driverMiddleware, driverController.getDriverAnalytics);

router.post(
  "/profile/upload-vehicle-image",
  driverMiddleware,
  upload.single("image"),
  driverController.uploadVehicleImage
);

module.exports = router;