const Joi = require("joi");

const createPollSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(1000).optional(),
  categoryId: Joi.string().uuid().optional(),
  options: Joi.array()
    .items(
      Joi.object({
        text: Joi.string().min(1).max(200).required(),
      })
    )
    .min(2)
    .max(10)
    .required(),
  expiresAt: Joi.date().greater("now").optional(),
  allowMultipleVotes: Joi.boolean().default(false),
});

const updatePollSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  categoryId: Joi.string().uuid().optional(),
  expiresAt: Joi.date().greater("now").optional(),
  status: Joi.string().valid("draft", "active", "expired").optional(),
});

const votePollSchema = Joi.object({
  optionId: Joi.string().uuid().required(),
});

module.exports = {
  createPollSchema,
  updatePollSchema,
  votePollSchema,
};
