const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const ctrl = require("../controllers/support.controller");

router.use(auth);

router.post("/tickets", ctrl.createSupportTicket);
router.get("/tickets", ctrl.getMySupportTickets);
router.post("/safety-report", ctrl.createSafetyReport);
router.post("/sos", ctrl.sendSOS);

module.exports = router;