const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const paymentController = require("../controllers/payment.controller");

router.get(
  "/virtual-account",
  authMiddleware,
  paymentController.getOrCreateVirtualAccount
);

router.post(
  "/webhook/paystack",
  paymentController.handlePaystackWebhook
);

module.exports = router;