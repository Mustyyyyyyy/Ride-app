const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const ctrl = require("../controllers/notification.controller");

router.use(auth);

router.get("/", ctrl.getMyNotifications);
router.get("/unread-count", ctrl.getUnreadNotificationCount);
router.patch("/mark-all-read", ctrl.markAllNotificationsAsRead);
router.patch("/:id/read", ctrl.markNotificationAsRead);
router.delete("/:id", ctrl.deleteNotification);

module.exports = router;