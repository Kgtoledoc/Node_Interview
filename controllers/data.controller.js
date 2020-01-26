const functions = require("../functions");

const config = require("../config");
const mongodb = require("mongodb").MongoClient;
const csvjson = require("csvjson");

// Retrieve all data
exports.getInformation = (req, res) => {
  mongodb.connect(
    process.env.MONGODB_URI,
    { useNewUrlParser: true, useUnifiedTopology: true },
    (err, client) => {
      if (err) throw err;
      client
        .db("resource_accomodation")
        .collection("products")
        .find()
        .toArray((err, data) => {
          if (err) throw err;
          res.send(data);
          client.close();
        });
    }
  );
};

// Filter the data depending of parameters entered!
exports.filter = (req, res) => {
  let min, max, rooms;
  if (req.query.min != undefined && req.query.min != "") {
    min = parseFloat(req.query.min);
  } else if (req.query.min == "") {
    min = 0;
  } else {
    min = undefined;
  }
  if (req.query.max != undefined && req.query.max != "") {
    max = parseFloat(req.query.max);
  } else if (req.query.max == "") {
    max = Infinity;
  } else {
    max = undefined;
  }

  if (req.query.rooms != undefined && req.query.rooms != "") {
    rooms = parseFloat(req.query.rooms);
  } else if (req.query.rooms == "") {
    rooms = "";
  } else {
    rooms = undefined;
  }

  functions
    .filterData(min, max, rooms)
    .then(data => {
      res.send(data);
    })
    .catch(err => res.send(err));
};

exports.processData = (req, res) => {
  let lon = req.query.lon;
  let lat = req.query.lat;
  let r = req.query.r;

  if (lon != undefined && lat != undefined && r != undefined) {
    functions
      .getDataFromDb()
      .then(data => {
        functions
          .averagePricePerMeter(lat, lon, r, data)
          .then(value => {
            res.send(value);
          })
          .catch(err => res.send(err));
      })
      .catch(err => console.log(err));
  } else {
    res.send("Please enter the values of latitude, longitude and radio.");
  }
};

// Function used in endpoint to create to transfer json in mongodb collection
exports.tranferData = (req, res) => {
  functions
    .dataJson(config.path)
    .then(dataJson => {
      mongodb.connect(
        process.env.MONGODB_URI,
        { useNewUrlParser: true, useUnifiedTopology: true },
        (err, client) => {
          if (err) throw err;

          client
            .db("resource_accomodation")
            .collection("products")
            .insertMany(JSON.parse(dataJson), (err, response) => {
              if (err) throw err;

              res.send(`Inserted: ${response.insertedCount} rows`);
              client.close();
            });
        }
      );
    })
    .catch(err => console.log(err));
};

exports.reportData = (req, res) => {
  let min, max, rooms, lat, lon, r, type;
  if (req.query.min != undefined && req.query.min != "") {
    min = parseFloat(req.query.min);
  } else if (req.query.min == "") {
    min = 0;
  } else {
    min = undefined;
  }
  if (req.query.max != undefined && req.query.max != "") {
    max = parseFloat(req.query.max);
  } else if (req.query.max == "") {
    max = Infinity;
  } else {
    max = undefined;
  }

  if (req.query.rooms != undefined && req.query.rooms != "") {
    rooms = parseFloat(req.query.rooms);
  } else if (req.query.rooms == "") {
    rooms = "";
  } else {
    rooms = undefined;
  }

  lat = req.query.lat || undefined;
  lon = req.query.lon || undefined;
  r = req.query.r || undefined;
  type = req.query.type || undefined;
  if (type != undefined) {
    functions
      .filterData(min, max, rooms)
      .then(data => {
        let dataFixed = [];
        for (let object of data) {
          delete object._id;
          dataFixed.push(object);
        }
        const csvData = csvjson.toCSV(dataFixed, {
          headers: "key"
        });

        if (type == "pdf") {
          functions
            .sendPDF(csvData, "filter_data")
            .then(value => {
              functions
                .averagePricePerMeter(lat, lon, r, data)
                .then(value => {
                  functions
                    .sendPDF(value, "average_price")
                    .then(data => {
                      res.zip({
                        files: [
                          {
                            path: __dirname + "/../pdf",
                            name: "pdf"
                          }
                        ],
                        filename: "files_pdf.zip"
                      });
                    })
                    .catch(err => res.send(err));
                })
                .catch(err => res.send(err));
            })
            .catch(err => res.send(err));
        } else if (type == "csv") {
          functions
            .sendCSV(csvData, "filter_data")
            .then(value => {
              functions
                .averagePricePerMeter(lat, lon, r, data)
                .then(value => {
                  functions
                    .sendCSV(value, "average_price")
                    .then(data => {
                      res.zip({
                        files: [
                          {
                            path: __dirname + "/../csv",
                            name: "csv"
                          }
                        ],
                        filename: "files_csv.zip"
                      });
                      res.send("Downloaded!");
                    })
                    .catch(err => res.send(err));
                })
                .catch(err => res.send(err));
            })
            .catch(err => res.send(err));
        } else {
          res.send("Please, enter the type of attribute");
        }
      })
      .catch(err => res.send(err));
  } else {
    res.send("Please, enter the type attribute");
  }
};
