module.exports = app => {
  const products = require("../controllers/data.controller");

  // Retrieve all the products depending of filter
  // http://localhost:3000/api/filter?min=1000&max=2000&rooms=4
  app.get("/api/filter", products.filter);
  // Retrieve all data of collection
  // http://localhost:3000/
  app.get("/api/products", products.getInformation);
  // Save data in the db mongo
  app.get("/api/migrationdb", products.tranferData);
  // Process data
  // http://localhost:3000/api/process?lat=20.0121&lon=-3.0123123&r=30000
  app.get("/api/process", products.processData);
  // Report data
  // http://localhost:3000/api/report?min=500&max=1000&rooms=2&lat=20.0121&lon=-3.0123123&r=30000&type=pdf
  app.get("/api/report", products.reportData);
};
