const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("@lib/config")();
const knex = require("@lib/knex");
const errors = require("@lib/errors");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiry }
  );
};

const register = async (userData) => {
  const { email, password, firstName, age } = userData;

  // Check if user already exists
  const existingUser = await knex("users").where({ email }).first();
  if (existingUser) {
    throw errors.VALIDATION_ERROR("User with this email already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const [user] = await knex("users")
    .insert({
      email,
      password: hashedPassword,
      firstName,
      age,
    })
    .returning(["id", "email", "firstName", "role", "age"]);

  return { user };
};

const login = async (email, password) => {
  // Find user
  const user = await knex("users").where({ email }).first();
  if (!user) {
    throw errors.UNAUTHORIZED("Invalid email or password");
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw errors.UNAUTHORIZED("Invalid email or password");
  }

  // Update last login time
  await knex("users")
    .where({ id: user.id })
    .update({ lastLoginTime: knex.fn.now() });

  // Generate token
  const authToken = generateToken(user);

  return {
    authToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      role: user.role,
      lastLoginTime: new Date(),
    },
  };
};

module.exports = {
  register,
  login,
};
