const Joi = require("joi");

const categorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
});

module.exports = {
  categorySchema,
};
