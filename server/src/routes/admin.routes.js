const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const ctrl = require("../controllers/admin.controller");

router.use(auth, role("admin"));

router.get("/dashboard", ctrl.getAdminDashboard);
router.get("/passengers", ctrl.getPassengers);
router.get("/drivers", ctrl.getDrivers);
router.get("/drivers/:id", ctrl.getDriverById);
router.patch("/drivers/:id/approve", ctrl.approveDriver);
router.patch("/drivers/:id/reject", ctrl.rejectDriver);
router.get("/rides", ctrl.getAllRides);
router.get("/rides/:id", ctrl.getRideById);
router.get("/safety-reports", ctrl.getSafetyReports);
router.patch("/safety-reports/:id", ctrl.updateSafetyReport);
router.get("/support-tickets", ctrl.getSupportTickets);
router.patch("/support-tickets/:id", ctrl.updateSupportTicket);

module.exports = router;