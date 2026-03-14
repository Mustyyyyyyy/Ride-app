const pool = require("../config/db");

const generateReference = (prefix = "TXN") =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

exports.getWallet = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM wallets WHERE user_id = $1`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.json({ wallet: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching wallet" });
  }
};

exports.getWalletBalance = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT balance FROM wallets WHERE user_id = $1`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.json({ balance: result.rows[0].balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching wallet balance" });
  }
};

exports.fundWallet = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Valid amount required" });
    }

    const walletResult = await pool.query(
      `UPDATE wallets
       SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING *`,
      [Number(amount), req.user.id]
    );

    const wallet = walletResult.rows[0];

    await pool.query(
      `INSERT INTO transactions (wallet_id, user_id, type, amount, description, status, reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        wallet.id,
        req.user.id,
        "credit",
        Number(amount),
        "Wallet funding",
        "success",
        generateReference("FUND"),
      ]
    );

    res.json({
      message: "Wallet funded successfully",
      balance: wallet.balance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error funding wallet" });
  }
};

exports.getWalletTransactions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*
       FROM transactions t
       JOIN wallets w ON t.wallet_id = w.id
       WHERE w.user_id = $1
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    res.json({ transactions: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching transactions" });
  }
};