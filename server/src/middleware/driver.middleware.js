const jwt = require("jsonwebtoken");

module.exports = function driverMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "oride_secret"
    );

    if (decoded.role !== "driver") {
      return res.status(403).json({
        message: "Access denied. Driver role required.",
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("DRIVER AUTH MIDDLEWARE ERROR:", error);
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};