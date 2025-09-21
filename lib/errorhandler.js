const logger = require("./logger");

const errorHandler = (error, req, res, next) => {
  logger.error(error);

  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  res.status(statusCode).json({
    isSuccess: false,
    status: "Error",
    message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};

module.exports = errorHandler;
