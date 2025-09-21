const route = require("@lib/route");
const validate = require("@lib/validate");
const logger = require("@lib/logger");
const { registerSchema, loginSchema } = require("../models/schemas/auth");
const { register, login } = require("../controllers/auth");

const registerHandler = async (req, res) => {
  validate(req.body, registerSchema);
  logger.info(
    "Register Request:- " + JSON.stringify({ ...req.body, password: "***" })
  );
  const result = await register(req.body);

  res.json({
    isSuccess: true,
    status: "Success",
    message: "User registered successfully",
    user: {
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName,
      role: result.user.role,
    },
  });
};

const loginHandler = async (req, res) => {
  validate(req.body, loginSchema);
  logger.info(
    "Login Request:- " + JSON.stringify({ ...req.body, password: "***" })
  );
  const result = await login(req.body.email.toLowerCase(), req.body.password);

  res.set("Authorization", `Bearer ${result.authToken}`);
  res.json({
    isSuccess: true,
    status: "Success",
    message: "Successfully logged in",
    authToken: result.authToken,
    user: {
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName,
      role: result.user.role,
      lastLoginTime: result.user.lastLoginTime,
    },
  });
};

module.exports = [
  route.post("/auth/register", registerHandler, { isPublic: true }),
  route.post("/auth/login", loginHandler, { isPublic: true }),
];
