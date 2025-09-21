const fs = require("fs");
const path = require("path");

function loadRoutesFromDirectory(dir, app) {
  if (!fs.existsSync(dir)) {
    console.log(`⚠️  Directory doesn't exist: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    if (file.endsWith(".js")) {
      const routePath = path.join(dir, file);
      console.log(`📝 Loading route: ${routePath}`);

      try {
        const route = require(routePath);
        if (route) {
          if (Array.isArray(route)) {
            route.forEach((routeHandler) => {
              if (typeof routeHandler === "function") {
                routeHandler(app);
              }
            });
          } else if (typeof route === "function") {
            route(app);
          }
        }
      } catch (error) {
        console.error(`❌ Error loading route ${routePath}:`, error.message);
      }
    }
  });
}

async function joinRoutes(modulePath, routeFolderName, app) {
  console.log("🔍 Loading routes from:", modulePath);
  console.log("🔍 Route folder name:", routeFolderName);

  if (!fs.existsSync(modulePath)) {
    console.log("⚠️  Modules directory not found, skipping dynamic routes...");
    return;
  }

  // Load routes from each module
  const modules = fs.readdirSync(modulePath);
  console.log("📂 Found modules:", modules);

  modules.forEach((module) => {
    const moduleRoutesPath = path.join(modulePath, module, routeFolderName);
    console.log(`🔍 Checking: ${moduleRoutesPath}`);
    if (fs.existsSync(moduleRoutesPath)) {
      console.log(`✅ Loading routes from module: ${module}`);
      loadRoutesFromDirectory(moduleRoutesPath, app);
    } else {
      console.log(`⚠️  No routes folder in module: ${module}`);
    }
  });
}

module.exports = joinRoutes;
