const _ = require("lodash");

const convertToCamelCase = (obj) => {
  if (_.isArray(obj)) {
    return obj.map(convertToCamelCase);
  } else if (_.isPlainObject(obj)) {
    return _.mapKeys(_.mapValues(obj, convertToCamelCase), (value, key) =>
      _.camelCase(key)
    );
  }
  return obj;
};

const camelCaseHandler = (options = {}) => {
  return (req, res, next) => {
    if (options.deep && req.body) {
      req.body = convertToCamelCase(req.body);
    }
    next();
  };
};

module.exports = { camelCaseHandler };
