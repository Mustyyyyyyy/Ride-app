const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const adminController = require("../controllers/admin.controller");

router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.getDashboard
);

router.get(
  "/users",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.getUsers
);

router.get(
  "/drivers",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.getDrivers
);

router.get(
  "/rides",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.getRides
);

router.get(
  "/support",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.getSupportTickets
);

router.patch(
  "/support/:id",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.updateSupportTicketStatus
);

module.exports = router;