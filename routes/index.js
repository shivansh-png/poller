const joinRoutes = require("../lib/joinRoutes");

module.exports = async (app, routeFolderName, modulePath) => {
  await joinRoutes(modulePath, routeFolderName, app);
};
