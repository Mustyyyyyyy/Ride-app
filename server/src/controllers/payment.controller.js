const axios = require("axios");
const crypto = require("crypto");
const pool = require("../config/db");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

exports.getOrCreateVirtualAccount = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const existingAccount = await pool.query(
      `
      SELECT *
      FROM virtual_accounts
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    if (existingAccount.rows.length > 0) {
      return res.status(200).json({
        account: existingAccount.rows[0],
      });
    }

    const userResult = await pool.query(
      `
      SELECT id, name, email
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    let customerCode = null;

    const existingCustomer = await pool.query(
      `
      SELECT *
      FROM paystack_customers
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    if (existingCustomer.rows.length > 0) {
      customerCode = existingCustomer.rows[0].customer_code;
    } else {
      const customerResponse = await axios.post(
        "https://api.paystack.co/customer",
        {
          email: user.email,
          first_name: user.name,
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      customerCode = customerResponse.data.data.customer_code;

      await pool.query(
        `
        INSERT INTO paystack_customers (user_id, customer_code, email)
        VALUES ($1, $2, $3)
        `,
        [userId, customerCode, user.email]
      );
    }

    const dvaResponse = await axios.post(
      "https://api.paystack.co/dedicated_account",
      {
        customer: customerCode,
        preferred_bank: "wema-bank",
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const dva = dvaResponse.data.data;

    await pool.query(
      `
      INSERT INTO virtual_accounts (
        user_id,
        customer_code,
        account_name,
        account_number,
        bank_name,
        provider_slug,
        paystack_dva_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        userId,
        customerCode,
        dva.account_name,
        dva.account_number,
        dva.bank?.name || "Wema Bank",
        dva.bank?.slug || "",
        String(dva.id),
      ]
    );

    const saved = await pool.query(
      `
      SELECT *
      FROM virtual_accounts
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    return res.status(200).json({
      account: saved.rows[0],
    });
  } catch (error) {
    console.error(
      "GET OR CREATE VIRTUAL ACCOUNT ERROR:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      message: "Failed to create transfer account",
    });
  }
};

exports.handlePaystackWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-paystack-signature"];

    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== signature) {
      return res.status(401).json({ message: "Invalid webhook signature" });
    }

    const event = req.body;

    if (event.event === "charge.success") {
      const data = event.data;
      const amount = Number(data.amount) / 100;
      const reference = data.reference;
      const customerCode = data.customer?.customer_code;

      const customerResult = await pool.query(
        `
        SELECT user_id
        FROM paystack_customers
        WHERE customer_code = $1
        LIMIT 1
        `,
        [customerCode]
      );

      if (customerResult.rows.length > 0) {
        const userId = Number(customerResult.rows[0].user_id);

        const existingTx = await pool.query(
          `
          SELECT id
          FROM transactions
          WHERE reference = $1
          LIMIT 1
          `,
          [reference]
        );

        if (existingTx.rows.length === 0) {
          const walletCheck = await pool.query(
            `
            SELECT id
            FROM wallets
            WHERE user_id = $1
            LIMIT 1
            `,
            [userId]
          );

          if (walletCheck.rows.length === 0) {
            await pool.query(
              `
              INSERT INTO wallets (user_id, balance)
              VALUES ($1, $2)
              `,
              [userId, 0]
            );
          }

          await pool.query(
            `
            UPDATE wallets
            SET balance = balance + $1
            WHERE user_id = $2
            `,
            [amount, userId]
          );

          await pool.query(
            `
            INSERT INTO transactions (user_id, amount, type, status, reference)
            VALUES ($1, $2, $3, $4, $5)
            `,
            [userId, amount, "credit", "success", reference]
          );

          await pool.query(
            `
            INSERT INTO notifications (user_id, title, message, type)
            VALUES ($1, $2, $3, $4)
            `,
            [
              userId,
              "Wallet funded",
              `₦${amount.toLocaleString()} was added to your wallet by bank transfer.`,
              "wallet",
            ]
          );
        }
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("PAYSTACK WEBHOOK ERROR:", error.message);
    return res.status(500).json({ message: "Webhook error" });
  }
};