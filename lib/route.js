const authMiddleware = require("./authmiddleware");
const logger = require("./logger");

const route = {
  get: (path, handler, options = {}) => {
    return (app) => {
      const middleware = options.isPublic ? [] : [authMiddleware];
      app.get(path, ...middleware, async (req, res, next) => {
        try {
          await handler(req, res);
        } catch (error) {
          next(error);
        }
      });
    };
  },

  post: (path, handler, options = {}) => {
    return (app) => {
      const middleware = options.isPublic ? [] : [authMiddleware];
      app.post(path, ...middleware, async (req, res, next) => {
        try {
          await handler(req, res);
        } catch (error) {
          next(error);
        }
      });
    };
  },

  put: (path, handler, options = {}) => {
    return (app) => {
      const middleware = options.isPublic ? [] : [authMiddleware];
      app.put(path, ...middleware, async (req, res, next) => {
        try {
          await handler(req, res);
        } catch (error) {
          next(error);
        }
      });
    };
  },

  delete: (path, handler, options = {}) => {
    return (app) => {
      const middleware = options.isPublic ? [] : [authMiddleware];
      app.delete(path, ...middleware, async (req, res, next) => {
        try {
          await handler(req, res);
        } catch (error) {
          next(error);
        }
      });
    };
  },
};

module.exports = route;
