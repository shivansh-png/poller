const knex = require("@lib/knex");
const errors = require("@lib/errors");
const moment = require("moment");
const _ = require("lodash");
const {
  getPollResults,
  getAnalytics,
} = require("@modules/polls/controllers/analytics");
const createPoll = async (pollData) => {
  const {
    title,
    description,
    categoryId,
    options,
    expiresAt,
    allowMultipleVotes,
    createdBy,
  } = pollData;

  return await knex.transaction(async (trx) => {
    // Create poll
    const [poll] = await trx("polls")
      .insert({
        title,
        description,
        categoryId,
        expiresAt,
        allowMultipleVotes,
        createdBy,
        status: "active",
      })
      .returning("*");

    // Create poll options
    const pollOptions = options.map((option) => ({
      pollId: poll.id,
      text: option.text,
      voteCount: 0,
    }));

    const createdOptions = await trx("poll_options")
      .insert(pollOptions)
      .returning("*");

    return {
      ...poll,
      options: createdOptions,
    };
  });
};

const getAllPolls = async ({ category, status, page = 1, limit = 10 }) => {
  let query = knex("polls")
    .leftJoin("poll_categories", "polls.categoryId", "poll_categories.id")
    .leftJoin("users", "polls.createdBy", "users.id")
    .select(
      "polls.*",
      "poll_categories.name as categoryName",
      "users.firstName as creatorFirstName"
    );

  // Apply filters
  if (category) {
    query = query.where("poll_categories.name", "ilike", `%${category}%`);
  }

  if (status) {
    query = query.where("polls.status", status);
  }

  // Check for expired polls and update status
  await knex("polls")
    .where("expiresAt", "<", knex.fn.now())
    .where("status", "!=", "expired")
    .update({ status: "expired" });

  // Get total count for pagination
  const totalQuery = query.clone();
  const [{ count }] = await totalQuery.count("polls.id as count");
  const total = parseInt(count);

  // Apply pagination
  const offset = (page - 1) * limit;
  const polls = await query
    .orderBy("polls.createdAt", "desc")
    .limit(limit)
    .offset(offset);

  // Get options for each poll
  const pollsWithOptions = await Promise.all(
    polls.map(async (poll) => {
      const options = await knex("poll_options")
        .where("pollId", poll.id)
        .orderBy("createdAt");

      return { ...poll, options };
    })
  );

  return {
    polls: pollsWithOptions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// in your poll service file
const polls = await knex("polls")
  .select("id", "title", "status")
  .orderBy("created_at", "desc");

const getPollById = async (pollId) => {
  const poll = await knex("polls")
    .leftJoin("poll_categories", "polls.categoryId", "poll_categories.id")
    .leftJoin("users", "polls.createdBy", "users.id")
    .select(
      "polls.*",
      "poll_categories.name as categoryName",
      "users.firstName as creatorFirstName"
    )
    .where("polls.id", pollId)
    .first();

  if (!poll) {
    throw errors.NOT_FOUND("Poll not found");
  }

  // Check if poll is expired
  if (
    poll.expiresAt &&
    moment(poll.expiresAt).isBefore(moment()) &&
    poll.status !== "expired"
  ) {
    await knex("polls").where("id", pollId).update({ status: "expired" });
    poll.status = "expired";
  }

  // Get poll options
  const options = await knex("poll_options")
    .where("pollId", pollId)
    .orderBy("createdAt");

  return { ...poll, options };
};

const updatePoll = async (pollId, updateData, userId) => {
  const poll = await knex("polls").where("id", pollId).first();

  if (!poll) {
    throw errors.NOT_FOUND("Poll not found");
  }

  if (poll.createdBy !== userId) {
    throw errors.FORBIDDEN("You can only update your own polls");
  }

  const [updatedPoll] = await knex("polls")
    .where("id", pollId)
    .update(updateData)
    .returning("*");

  return updatedPoll;
};

const deletePoll = async (pollId, userId) => {
  const poll = await knex("polls").where("id", pollId).first();

  if (!poll) {
    throw errors.NOT_FOUND("Poll not found");
  }

  if (poll.createdBy !== userId) {
    throw errors.FORBIDDEN("You can only delete your own polls");
  }

  await knex("polls").where("id", pollId).del();
};

const votePoll = async (pollId, optionId, userId, ipAddress) => {
  return await knex.transaction(async (trx) => {
    // Get poll details
    const poll = await trx("polls").where("id", pollId).first();

    if (!poll) {
      throw errors.NOT_FOUND("Poll not found");
    }

    // Check if poll is expired
    if (poll.expiresAt && moment(poll.expiresAt).isBefore(moment())) {
      await trx("polls").where("id", pollId).update({ status: "expired" });
      throw errors.POLL_EXPIRED();
    }

    if (poll.status !== "active") {
      throw errors.FORBIDDEN("This poll is not active");
    }

    // Check if option exists
    const option = await trx("poll_options")
      .where("id", optionId)
      .where("pollId", pollId)
      .first();

    if (!option) {
      throw errors.NOT_FOUND("Poll option not found");
    }

    // Check for duplicate vote
    const existingVote = await trx("votes")
      .where("pollId", pollId)
      .where("userId", userId)
      .first();

    if (existingVote && !poll.allowMultipleVotes) {
      throw errors.DUPLICATE_VOTE();
    }

    // Record vote
    await trx("votes").insert({
      pollId,
      optionId,
      userId,
      ipAddress,
    });

    // Update vote count
    await trx("poll_options").where("id", optionId).increment("voteCount", 1);

    // Get updated results
    const results = await getPollResults(pollId, trx);
    return results;
  });
};

module.exports = {
  createPoll,
  getAllPolls,
  getPollById,
  updatePoll,
  deletePoll,
  votePoll,
  getPollSummaries,
};
