const jwt = require("jsonwebtoken");
const config = require("./config")();
const errors = require("./errors");

const authMiddleware = (req, res, next) => {
  try {
    const token =
      req.header("Authorization")?.replace("Bearer ", "") ||
      req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        isSuccess: false,
        status: "Error",
        message: "Access token required",
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        isSuccess: false,
        status: "Error",
        message: "Invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        isSuccess: false,
        status: "Error",
        message: "Token expired",
      });
    }
    next(error);
  }
};

module.exports = authMiddleware;
