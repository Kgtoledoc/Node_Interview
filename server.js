if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const bodyParser = require("body-parser");

const config = require("./config");
const zip = require("express-easy-zip");

const app = express();

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.set("port", process.env.PORT || config.port);
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
app.get("/", (req, res) => {
  res.send(
    "<h1>Node Interview - Routes</h1><ul><li>/api/migrationdb -> Create a db depending of csv file</li><li>/api/products -> Retrieve all products from db</li><li>/api/filter?min=&max=&rooms -> Filter the data from db</li><li>/api/process?lat=&lon=&r= -> Process all data of database and return a average price</li><li>/api/report?min=&max=&rooms=&lat=&lon=&r=&type=</li></ul>"
  );

  console.log(process.env.MONGODB_URI);
});

app.listen(app.get("port"), () => {
  console.log("Server running on port 3000");
});
