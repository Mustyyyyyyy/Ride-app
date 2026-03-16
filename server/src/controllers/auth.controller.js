const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (name, email, phone, password, role, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, phone, role, is_verified
      `,
      [
        name.trim(),
        normalizedEmail,
        phone ? phone.trim() : null,
        hashedPassword,
        role || "passenger",
        true,
      ]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "oride_secret",
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Registration successful",
      token,
      user,
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return res.status(500).json({
      message: "Server error during registration",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const result = await pool.query(
      `
      SELECT id, name, email, phone, password, role, is_verified
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const userFromDb = result.rows[0];

    if (!userFromDb.password) {
      return res.status(500).json({
        message: "User password is missing in database",
      });
    }

    const passwordMatch = await bcrypt.compare(password, userFromDb.password);

    if (!passwordMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const user = {
      id: userFromDb.id,
      name: userFromDb.name,
      email: userFromDb.email,
      phone: userFromDb.phone,
      role: userFromDb.role,
      is_verified: userFromDb.is_verified,
    };

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "oride_secret",
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({
      message: "Server error during login",
      error: error.message,
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, name, email, phone, role, is_verified
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [Number(req.user.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error("GET ME ERROR:", error);
    return res.status(500).json({
      message: "Server error fetching profile",
      error: error.message,
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        message: "If the email exists, a reset link has been sent",
      });
    }

    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 1000 * 60 * 30);

    await pool.query(
      `
      UPDATE users
      SET reset_password_token = $1,
          reset_password_expires = $2
      WHERE id = $3
      `,
      [resetToken, resetExpires, user.id]
    );

    const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your ORIDE password",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Password Reset</h2>
          <p>Hello ${user.name},</p>
          <p>Click the button below to reset your password:</p>
          <p>
            <a href="${resetLink}" style="display:inline-block;padding:12px 20px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;">
              Reset Password
            </a>
          </p>
          <p>If the button doesn't work, use this link:</p>
          <p>${resetLink}</p>
        </div>
      `,
    });

    return res.status(200).json({
      message: "If the email exists, a reset link has been sent",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return res.status(500).json({
      message: "Server error while sending reset email",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      UPDATE users
      SET
        password = $1,
        reset_password_token = NULL,
        reset_password_expires = NULL
      WHERE
        reset_password_token = $2
        AND reset_password_expires > NOW()
      RETURNING id
      `,
      [hashedPassword, token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return res.status(500).json({
      message: "Server error while resetting password",
    });
  }
};