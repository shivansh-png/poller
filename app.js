let app;
async function init() {
  // Npm Modules
  require("module-alias/register");
  const express = require("express");
  const path = require("path");
  const cors = require("cors");
  const http = require("http");
  const session = require("express-session");
  const socketIo = require("socket.io");

  // Local Modules
  const routes = require("./routes");
  const errorHandler = require("./lib/errorhandler");
  const errors = require("./lib/errors");
  const jsonParser = require("./lib/jsonParser");
  const logger = require("./lib/logger");
  const knex = require("./lib/knex");
  const Constants = require("./constant/constants");
  const config = require("./lib/config")();
  const { camelCaseHandler } = require("./lib/caseConverterMiddleware");

  // create app instance
  app = express();

  // Create HTTP server
  const server = http.createServer(app);

  // Setup Socket.IO for real-time updates
  const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Make io available globally
  app.set("io", io);

  // enable cors
  app.use(cors({ exposedHeaders: ["Authorization", "X-Client-Key"] }));

  // json parsing with increased limit for large payloads
  app.use(
    jsonParser({
      limit: "1mb",
      verify: (req, res, buf) => {
        req.rawBody = buf;
      },
    })
  );

  app.use(camelCaseHandler({ deep: true }));

  // express session
  app.use(
    session({
      resave: false,
      saveUninitialized: true,
      secret:
        process.env.SESSION_SECRET || "7e3b0b2c-e135-461c-81b8-5ea9273f282a",
    })
  );

  // Connect to database
  knex.migrate
    .latest()
    .then(() => console.log("migration successful"))
    .catch((err) => console.log({ err }));

  // Log Knex Queries in development
  if (process.env.NODE_ENV !== "production") {
    knex.on("query", (queryData) => console.log("\n" + queryData.sql));
  }

  app.get("/", (req, res) => res.send("Polling App Backend is up"));

  // setup routes
  const modulePath = path.join(__dirname, Constants.moduleFolderName);
  await routes(app, Constants.routeFolderName, modulePath);

  // Socket.IO connection handling
  io.on("connection", (socket) => {
    logger.info("New client connected:", socket.id);

    socket.on("joinPoll", (pollId) => {
      socket.join(`poll_${pollId}`);
      logger.info(`Client ${socket.id} joined poll ${pollId}`);
    });

    socket.on("leavePoll", (pollId) => {
      socket.leave(`poll_${pollId}`);
      logger.info(`Client ${socket.id} left poll ${pollId}`);
    });

    socket.on("disconnect", () => {
      logger.info("Client disconnected:", socket.id);
    });
  });

  // error handling
  app.use(() => {
    throw errors.ENDPOINT_NOT_FOUND();
  });
  app.use(errorHandler);

  // start listening
  const host = config.host || "localhost";
  const port = config.port || 3000;

  server.timeout = 5 * 60 * 1000; // 5 minutes
  server.keepAliveTimeout = 5 * 60 * 1000;
  server.headersTimeout = 6 * 60 * 1000;

  server.listen(port, () =>
    logger.info(`Polling App online @ ${host}:${port}`)
  );
}

// run app
init().catch((e) => {
  throw e;
});

module.exports.app = app;
