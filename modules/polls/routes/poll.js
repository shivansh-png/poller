const route = require("@lib/route");
const validate = require("@lib/validate");
const logger = require("@lib/logger");
const {
  createPollSchema,
  votePollSchema,
  updatePollSchema,
} = require("../models/schemas/poll");
const {
  createPoll,
  getAllPolls,
  getPollById,
  updatePoll,
  deletePoll,
  votePoll,
  getPollResults,
  getAnalytics,
} = require("../controllers/poll");

const createPollHandler = async (req, res) => {
  validate(req.body, createPollSchema);
  const result = await createPoll({ ...req.body, createdBy: req.user.id });

  res.status(201).json({
    isSuccess: true,
    status: "Success",
    message: "Poll created successfully",
    poll: result,
  });
};

const getAllPollsHandler = async (req, res) => {
  const { category, status, page = 1, limit = 10 } = req.query;
  const result = await getAllPolls({
    category,
    status,
    page: parseInt(page),
    limit: parseInt(limit),
  });

  res.json({
    isSuccess: true,
    status: "Success",
    data: result.polls,
    pagination: result.pagination,
  });
};

const getPollHandler = async (req, res) => {
  const result = await getPollById(req.params.id);

  res.json({
    isSuccess: true,
    status: "Success",
    poll: result,
  });
};

const updatePollHandler = async (req, res) => {
  validate(req.body, updatePollSchema);
  const result = await updatePoll(req.params.id, req.body, req.user.id);

  res.json({
    isSuccess: true,
    status: "Success",
    message: "Poll updated successfully",
    poll: result,
  });
};

const deletePollHandler = async (req, res) => {
  await deletePoll(req.params.id, req.user.id);

  res.json({
    isSuccess: true,
    status: "Success",
    message: "Poll deleted successfully",
  });
};

const voteHandler = async (req, res) => {
  validate(req.body, votePollSchema);
  const result = await votePoll(
    req.params.id,
    req.body.optionId,
    req.user.id,
    req.ip
  );

  // Emit real-time update via Socket.IO
  const io = req.app.get("io");
  io.to(`poll_${req.params.id}`).emit("voteUpdate", result);

  res.json({
    isSuccess: true,
    status: "Success",
    message: "Vote recorded successfully",
    results: result,
  });
};

const getResultsHandler = async (req, res) => {
  const result = await getPollResults(req.params.id);

  res.json({
    isSuccess: true,
    status: "Success",
    results: result,
  });
};

const getAnalyticsHandler = async (req, res) => {
  const result = await getAnalytics(req.params.id);

  res.json({
    isSuccess: true,
    status: "Success",
    analytics: result,
  });
};

module.exports = [
  route.post("/polls", createPollHandler),
  route.get("/polls", getAllPollsHandler),
  route.get("/polls/:id", getPollHandler),
  route.put("/polls/:id", updatePollHandler),
  route.delete("/polls/:id", deletePollHandler),
  route.post("/polls/:id/vote", voteHandler),
  route.get("/polls/:id/results", getResultsHandler),
  route.get("/polls/:id/analytics", getAnalyticsHandler),
];
