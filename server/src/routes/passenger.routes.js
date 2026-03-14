const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const passengerController = require("../controllers/passenger.controller");

router.get("/dashboard", authMiddleware, passengerController.getDashboard);

router.get("/wallet", authMiddleware, passengerController.getWallet);
router.get("/transactions", authMiddleware, passengerController.getTransactions);
router.post("/wallet/fund", authMiddleware, passengerController.fundWallet);

router.get("/notifications", authMiddleware, passengerController.getNotifications);

router.get("/support", authMiddleware, passengerController.getSupportTickets);
router.post("/support", authMiddleware, passengerController.createSupportTicket);

module.exports = router;