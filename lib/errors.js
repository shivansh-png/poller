const errors = {
  VALIDATION_ERROR: (message = "Validation failed") => ({
    name: "ValidationError",
    message,
    statusCode: 400,
  }),

  UNAUTHORIZED: (message = "Unauthorized") => ({
    name: "UnauthorizedError",
    message,
    statusCode: 401,
  }),

  FORBIDDEN: (message = "Forbidden") => ({
    name: "ForbiddenError",
    message,
    statusCode: 403,
  }),

  NOT_FOUND: (message = "Resource not found") => ({
    name: "NotFoundError",
    message,
    statusCode: 404,
  }),

  DUPLICATE_VOTE: (message = "You have already voted on this poll") => ({
    name: "DuplicateVoteError",
    message,
    statusCode: 409,
  }),

  POLL_EXPIRED: (message = "This poll has expired") => ({
    name: "PollExpiredError",
    message,
    statusCode: 410,
  }),

  ENDPOINT_NOT_FOUND: (message = "Endpoint not found") => ({
    name: "EndpointNotFoundError",
    message,
    statusCode: 404,
  }),

  INTERNAL_SERVER_ERROR: (message = "Internal server error") => ({
    name: "InternalServerError",
    message,
    statusCode: 500,
  }),
};

module.exports = errors;
