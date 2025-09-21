let config = {};

function init(configPath) {
  config = {
    host: process.env.HOST || "localhost",
    port: process.env.PORT || 3000,
    jwtSecret: process.env.JWT_SECRET || "your-secret-key",
    jwtExpiry: process.env.JWT_EXPIRY || "24h",
    database: {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || "polling_app",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "password",
    },
  };
}

// Initialize with default values if not already initialized
if (Object.keys(config).length === 0) {
  init();
}

module.exports = () => config;
module.exports.init = init;
