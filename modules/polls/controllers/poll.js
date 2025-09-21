const knex = require("@lib/knex");
const errors = require("@lib/errors");
const moment = require("moment");
const _ = require("lodash");
const { getPollResults } = require("@modules/polls/controllers/analytics");

// Create Poll
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

// Get all polls (with options & pagination)
const getAllPolls = async ({ category, status, page = 1, limit = 10 }) => {
  // Base query (without pagination)
  let baseQuery = knex("polls")
    .leftJoin("poll_categories", "polls.categoryId", "poll_categories.id")
    .leftJoin("users", "polls.createdBy", "users.id")
    .select(
      "polls.id",
      "polls.title",
      "polls.description",
      "polls.status",
      "polls.expiresAt",
      "polls.allowMultipleVotes",
      "polls.created_at",
      "poll_categories.name as categoryName",
      "users.firstName as creatorFirstName"
    );

  // Apply filters
  if (category) {
    baseQuery = baseQuery.where(
      "poll_categories.name",
      "ilike",
      `%${category}%`
    );
  }

  if (status) {
    baseQuery = baseQuery.where("polls.status", status);
  }

  // ✅ Expire old polls before fetching
  await knex("polls")
    .where("expiresAt", "<", knex.fn.now())
    .where("status", "!=", "expired")
    .update({ status: "expired" });

  // ✅ Count query (no GROUP BY needed)
  const totalQuery = baseQuery.clone().clearSelect().count("polls.id as count");
  const [{ count }] = await totalQuery;
  const total = parseInt(count, 10);

  // ✅ Data query (paginated)
  const offset = (page - 1) * limit;
  const polls = await baseQuery
    .clone()
    .orderBy("polls.created_at", "desc")
    .limit(limit)
    .offset(offset);

  // ✅ Attach options for each poll
  const pollsWithOptions = await Promise.all(
    polls.map(async (poll) => {
      const options = await knex("poll_options")
        .where("pollId", poll.id)
        .orderBy("created_at");
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

// Get poll summaries (lightweight for Home/Browse)
const getPollSummaries = async () => {
  return await knex("polls")
    .select("id", "title", "status")
    .orderBy("created_at", "desc"); // ✅ fix
};

// Get poll by ID
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

  if (!poll) throw errors.NOT_FOUND("Poll not found");

  if (
    poll.expiresAt &&
    moment(poll.expiresAt).isBefore(moment()) &&
    poll.status !== "expired"
  ) {
    await knex("polls").where("id", pollId).update({ status: "expired" });
    poll.status = "expired";
  }

  const options = await knex("poll_options")
    .where("pollId", pollId)
    .orderBy("created_at"); // ✅ fix

  return { ...poll, options };
};

// Update Poll
const updatePoll = async (pollId, updateData, userId) => {
  const poll = await knex("polls").where("id", pollId).first();
  if (!poll) throw errors.NOT_FOUND("Poll not found");
  if (poll.createdBy !== userId)
    throw errors.FORBIDDEN("You can only update your own polls");

  const [updatedPoll] = await knex("polls")
    .where("id", pollId)
    .update(updateData)
    .returning("*");

  return updatedPoll;
};

// Delete Poll
const deletePoll = async (pollId, userId) => {
  const poll = await knex("polls").where("id", pollId).first();
  if (!poll) throw errors.NOT_FOUND("Poll not found");
  if (poll.createdBy !== userId)
    throw errors.FORBIDDEN("You can only delete your own polls");

  await knex("polls").where("id", pollId).del();
};

// Vote
const votePoll = async (pollId, optionId, userId, ipAddress) => {
  return await knex.transaction(async (trx) => {
    const poll = await trx("polls").where("id", pollId).first();
    if (!poll) throw errors.NOT_FOUND("Poll not found");

    if (poll.expiresAt && moment(poll.expiresAt).isBefore(moment())) {
      await trx("polls").where("id", pollId).update({ status: "expired" });
      throw errors.POLL_EXPIRED();
    }
    if (poll.status !== "active")
      throw errors.FORBIDDEN("This poll is not active");

    const option = await trx("poll_options")
      .where("id", optionId)
      .andWhere("pollId", pollId)
      .first();
    if (!option) throw errors.NOT_FOUND("Poll option not found");

    const existingVote = await trx("votes")
      .where("pollId", pollId)
      .andWhere("userId", userId)
      .first();
    if (existingVote && !poll.allowMultipleVotes) throw errors.DUPLICATE_VOTE();

    await trx("votes").insert({ pollId, optionId, userId, ipAddress });
    await trx("poll_options").where("id", optionId).increment("voteCount", 1);

    return await getPollResults(pollId, trx);
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
