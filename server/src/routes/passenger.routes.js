const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const passengerController = require("../controllers/passenger.controller");

router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware("passenger"),
  passengerController.getDashboard
);

router.get(
  "/wallet",
  authMiddleware,
  roleMiddleware("passenger"),
  passengerController.getWallet
);

router.get(
  "/transactions",
  authMiddleware,
  roleMiddleware("passenger"),
  passengerController.getTransactions
);

router.get(
  "/notifications",
  authMiddleware,
  roleMiddleware("passenger"),
  passengerController.getNotifications
);

router.get(
  "/support",
  authMiddleware,
  roleMiddleware("passenger"),
  passengerController.getSupportTickets
);

router.post(
  "/support",
  authMiddleware,
  roleMiddleware("passenger"),
  passengerController.createSupportTicket
);

module.exports = router;