const route = require("@lib/route");
const { getPollResults, getAnalytics } = require("../controllers/analytics");

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
  route.get("/polls/:id/results", getResultsHandler),
  route.get("/polls/:id/analytics", getAnalyticsHandler),
];
