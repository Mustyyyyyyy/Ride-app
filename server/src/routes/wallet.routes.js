const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const ctrl = require("../controllers/wallet.controller");

router.use(auth);

router.get("/", ctrl.getWallet);
router.get("/balance", ctrl.getWalletBalance);
router.post("/fund", ctrl.fundWallet);
router.get("/transactions", ctrl.getWalletTransactions);

module.exports = router;