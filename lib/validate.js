const Joi = require("joi");
const errors = require("./errors");

const validate = (data, schema) => {
  const { error } = schema.validate(data);
  if (error) {
    throw errors.VALIDATION_ERROR(error.details[0].message);
  }
};

module.exports = validate;
