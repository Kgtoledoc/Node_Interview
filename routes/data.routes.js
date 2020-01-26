module.exports = app => {
  const products = require("../controllers/data.controller");

  // Retrieve all the products depending of filter
  // http://localhost:3000/api/filter?min=1000&max=2000&rooms=4
  app.get("/api/filter", products.filter);
  // Retrieve all data of collection
  app.get("/api/products", products.getInformation);
  // Save data in the db mongo
  app.get("/api/migrationdb", products.tranferData);
  // Process data
  app.get("/api/process", products.processData);
  // Report data
  app.get("/api/report", products.reportData);
};
