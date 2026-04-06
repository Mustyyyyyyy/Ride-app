const axios = require("axios");
const crypto = require("crypto");
const pool = require("../config/db");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

exports.getOrCreateVirtualAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user exists
    const userResult = await pool.query(
      `SELECT id, name, email FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    try {
      // Check for existing virtual account
      const existingAccount = await pool.query(
        `SELECT * FROM virtual_accounts WHERE user_id = $1 LIMIT 1`,
        [userId]
      );

      if (existingAccount.rows.length > 0) {
        return res.status(200).json({
          account: existingAccount.rows[0],
        });
      }
    } catch (dbError) {
      // Table might not exist yet, continue
      console.log("Virtual accounts table check:", dbError.message);
    }

    // Try to get or create Paystack customer
    let customerCode = null;

    try {
      const existingCustomer = await pool.query(
        `SELECT * FROM paystack_customers WHERE user_id = $1 LIMIT 1`,
        [userId]
      );

      if (existingCustomer.rows.length > 0) {
        customerCode = existingCustomer.rows[0].customer_code;
      }
    } catch (dbError) {
      console.log("Paystack customers table check:", dbError.message);
    }

    // Create customer on Paystack if not exists
    if (!customerCode) {
      try {
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

        // Save to database (ignore errors if table doesn't exist)
        try {
          await pool.query(
            `INSERT INTO paystack_customers (user_id, customer_code, email) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET customer_code = EXCLUDED.customer_code`,
            [userId, customerCode, user.email]
          );
        } catch (saveError) {
          console.log("Could not save Paystack customer:", saveError.message);
        }
      } catch (paystackError) {
        console.error("Paystack customer creation failed:", paystackError.response?.data || paystackError.message);
        return res.status(500).json({
          message: "Failed to create payment account with Paystack",
          error: paystackError.response?.data?.message || paystackError.message,
        });
      }
    }

    // Create dedicated virtual account
    try {
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

      // Save virtual account (ignore errors if table doesn't exist)
      try {
        await pool.query(
          `INSERT INTO virtual_accounts (user_id, customer_code, account_name, account_number, bank_name, provider_slug, paystack_dva_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (user_id) DO UPDATE SET account_number = EXCLUDED.account_number`,
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
          `SELECT * FROM virtual_accounts WHERE user_id = $1 LIMIT 1`,
          [userId]
        );

        return res.status(200).json({
          account: saved.rows[0],
        });
      } catch (saveError) {
        console.log("Could not save virtual account:", saveError.message);
        // Return the account details even if we couldn't save
        return res.status(200).json({
          account: {
            user_id: userId,
            customer_code: customerCode,
            account_name: dva.account_name,
            account_number: dva.account_number,
            bank_name: dva.bank?.name || "Wema Bank",
            provider_slug: dva.bank?.slug || "",
            paystack_dva_id: String(dva.id),
          },
        });
      }
    } catch (dvaError) {
      console.error("DVA creation failed:", dvaError.response?.data || dvaError.message);
      return res.status(500).json({
        message: "Failed to create virtual account",
        error: dvaError.response?.data?.message || dvaError.message,
      });
    }
  } catch (error) {
    console.error("GET OR CREATE VIRTUAL ACCOUNT ERROR:", error.message);
    return res.status(500).json({
      message: "Failed to create transfer account",
      error: error.message,
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