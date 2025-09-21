const express = require("express");

module.exports = (options = {}) => {
  return express.json(options);
};
