const express = require("express");
const bodyParser = require("body-parser");
const controller = require("./controllers/data.controller");

const mongodb = require("mongodb").MongoClient;
const config = require("./config");

const zip = require("express-easy-zip");

const app = express();

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(bodyParser.json());

//Enable CORS for all HTTP methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(zip());

// Connection with DB

require("./routes/data.routes")(app);

app.listen(config.port, () => {
  console.log("Server running on port 3000");
});
