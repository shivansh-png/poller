const knex = require("@lib/knex");
const errors = require("@lib/errors");
const _ = require("lodash");

const getPollResults = async (pollId, trx = knex) => {
  const poll = await trx("polls").where("id", pollId).first();

  if (!poll) {
    throw errors.NOT_FOUND("Poll not found");
  }

  const options = await trx("poll_options")
    .where("pollId", pollId)
    .orderBy("createdAt");

  const totalVotes = await trx("votes")
    .where("pollId", pollId)
    .count("id as count")
    .first();

  const total = parseInt(totalVotes.count);

  const results = options.map((option) => ({
    id: option.id,
    text: option.text,
    voteCount: option.voteCount,
    percentage: total > 0 ? Math.round((option.voteCount / total) * 100) : 0,
  }));

  return {
    pollId,
    totalVotes: total,
    options: results,
  };
};

const getAnalytics = async (pollId) => {
  const poll = await knex("polls").where("id", pollId).first();

  if (!poll) {
    throw errors.NOT_FOUND("Poll not found");
  }

  // Get basic results
  const results = await getPollResults(pollId);

  // Get demographic breakdown
  const ageGroups = await knex("votes")
    .join("users", "votes.userId", "users.id")
    .join("poll_options", "votes.optionId", "poll_options.id")
    .where("votes.pollId", pollId)
    .select("poll_options.text as option")
    .select(
      knex.raw(`
      CASE 
        WHEN users.age < 18 THEN 'Under 18'
        WHEN users.age BETWEEN 18 AND 24 THEN '18-24'
        WHEN users.age BETWEEN 25 AND 34 THEN '25-34'
        WHEN users.age BETWEEN 35 AND 44 THEN '35-44'
        WHEN users.age BETWEEN 45 AND 54 THEN '45-54'
        WHEN users.age >= 55 THEN '55+'
        ELSE 'Unknown'
      END as age_group
    `)
    )
    .select(knex.raw("COUNT(*) as count"));

  const groupedByAge = _.groupBy(ageGroups, "age_group");
  const ageAnalysis = Object.keys(groupedByAge).map((ageGroup) => ({
    ageGroup,
    votes: groupedByAge[ageGroup],
  }));

  // Generate insights
  const insights = generateInsights(results, ageAnalysis);

  return {
    ...results,
    demographics: {
      ageGroups: ageAnalysis,
    },
    insights,
  };
};

const generateInsights = (results, ageAnalysis) => {
  const insights = [];

  // Find winning option
  const winner = results.options.reduce((prev, current) =>
    prev.voteCount > current.voteCount ? prev : current
  );

  insights.push(
    `${winner.text} is the most popular choice with ${winner.percentage}% of votes (${winner.voteCount} votes).`
  );

  // Close race detection
  const sortedOptions = results.options.sort(
    (a, b) => b.voteCount - a.voteCount
  );
  if (sortedOptions.length > 1) {
    const diff = sortedOptions[0].percentage - sortedOptions[1].percentage;
    if (diff < 10) {
      insights.push(
        `This is a close race! The top two options are separated by only ${diff}%.`
      );
    }
  }

  // Participation insight
  if (results.totalVotes > 100) {
    insights.push(
      `Great participation with ${results.totalVotes} total votes!`
    );
  } else if (results.totalVotes < 10) {
    insights.push(
      `Limited participation so far with only ${results.totalVotes} votes.`
    );
  }

  // Age group insights (simplified for demo)
  const dominantAgeGroup = ageAnalysis.reduce((prev, current) =>
    (prev.votes?.length || 0) > (current.votes?.length || 0) ? prev : current
  );

  if (dominantAgeGroup.votes?.length > 0) {
    insights.push(
      `The ${dominantAgeGroup.ageGroup} age group shows the highest participation.`
    );
  }

  return insights;
};

module.exports = {
  getPollResults,
  getAnalytics,
};
