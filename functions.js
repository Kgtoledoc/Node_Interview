const fs = require("fs");
const mongodb = require("mongodb").MongoClient;
const pdf = require("html-pdf");

// Function to convert a csv into json
const csvtojson = (dataHeader, dataBody) => {
  let json = [];
  let lenJson = dataHeader.length;
  let lenBody = dataBody.length;

  for (let j = 0; j < lenBody; j++) {
    let objectJson = new Object();
    let body = dataBody[j].split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
    for (let i = 0; i < lenJson; i++) {
      // Convert the numbers that are string in number
      if (isNaN(body[i]) || body[i].length == 0) {
        objectJson[dataHeader[i]] = body[i];
      } else {
        objectJson[dataHeader[i]] = parseFloat(body[i]);
      }
    }
    json.push(objectJson);
  }

  return json;
};
// Function to transform CSV
exports.dataJson = async csvPath => {
  const json = await new Promise((resolve, reject) => {
    fs.readFile(csvPath, "utf8", (err, data) => {
      if (err) {
        return reject(err);
      } else {
        let dataArray = data.split(/\r?\n/);
        let headerArray = dataArray.shift();
        let dataHeader = headerArray.split(",");
        let dataBody = dataArray;
        let procesedData = csvtojson(dataHeader, dataBody);
        return resolve(procesedData);
      }
    });
  });
  return JSON.stringify(json);
};

// Get all data from db
exports.getDataFromDb = async () => {
  const json = await new Promise((resolve, reject) => {
    mongodb.connect(
      process.env.MONGODB_URI,
      { useNewUrlParser: true, useUnifiedTopology: true },
      (err, client) => {
        if (err) return reject(err);
        client
          .db("resource_accomodation")
          .collection("products")
          .find({})
          .toArray((err, data) => {
            if (err) return reject(err);
            client.close();
            return resolve(data);
          });
      }
    );
  });

  return json;
};

// Convert latitude and longitude in radians
const rad = x => {
  return (x * Math.PI) / 180;
};

// Get if the the point is inside or outside of convergence radio
const isInside = (lat_x, lon_x, lat_y, lon_y, r, R) => {
  let dLat = rad(lat_y - lat_x);
  let dLon = rad(lon_y - lon_x);
  let lat1 = rad(lat_x);
  let lat2 = rad(lat_y);

  let a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let d = R * c;

  if (d.toFixed(2) <= parseFloat(r)) {
    return true;
  }
  return false;
};

// Function to find the average of number array
const averageArray = array => {
  let sum = array.reduce((acu, next) => {
    return acu + next;
  }, 0);
  return sum / array.length;
};

// Function that return the average depending of data some parameters
exports.averagePricePerMeter = async (lat, lon, r, data) => {
  // create a promise
  let price = await new Promise((resolve, reject) => {
    let pricePerMeter = [];
    let R = 6378.137;
    for (let object of data) {
      if (isInside(lat, lon, object.Latitud, object.Longitud, r, R)) {
        pricePerMeter.push(object["Precio por metro"]);
      } else {
        continue;
      }
    }
    if (pricePerMeter.length != 0) {
      let result = averageArray(pricePerMeter);
      return resolve(`The average per meter price is ${result.toFixed(2)}`);
    } else {
      let result = "The coordinates of DB are outside of convergence radio";
      return resolve(result);
    }
    //});
  });

  return price;
};

// Function used to filter data
exports.filterData = (min, max, rooms) => {
  let filter = new Promise((resolve, reject) => {
    mongodb.connect(
      process.env.MONGODB_URI,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true
      },
      (err, client) => {
        if (err) return reject(err);

        if (
          min != undefined &&
          max != undefined &&
          rooms != undefined &&
          min != "" &&
          max != ""
        ) {
          client
            .db("resource_accomodation")
            .collection("products")
            .find({ Precio: { $gte: min, $lte: max }, Habitaciones: rooms })
            .toArray((err, data) => {
              client.close();

              return resolve(data);
            });
        } else if (
          min != undefined &&
          max != undefined &&
          min != "" &&
          max != "" &&
          rooms == undefined
        ) {
          client
            .db("resource_accomodation")
            .collection("products")
            .find({ Precio: { $gte: min, $lte: max } })
            .toArray((err, data) => {
              client.close();

              return resolve(data);
            });
        } else if (min != undefined && max == undefined && rooms == undefined) {
          client
            .db("resource_accomodation")
            .collection("products")
            .find({ Precio: { $gte: min } })
            .toArray((err, data) => {
              client.close();

              return resolve(data);
            });
        } else if (min == undefined && max != undefined && rooms == undefined) {
          client
            .db("resource_accomodation")
            .collection("products")
            .find({ Precio: { $lte: max } })
            .toArray((err, data) => {
              client.close();

              return resolve(data);
            });
        } else if (min == undefined && max == undefined && rooms != undefined) {
          client
            .db("resource_accomodation")
            .collection("products")
            .find({ Habitaciones: rooms })
            .toArray((err, data) => {
              client.close();

              return resolve(data);
            });
        } else {
          return resolve("No filter entered!");
        }
      }
    );
  });
  return filter;
};

// Function to create pdf file
const createPDF = (data, name) => {
  let pdfCreated = new Promise((resolve, reject) => {
    pdf.create(data).toFile(`./pdf/${name}.pdf`, (err, res) => {
      if (err) return reject(err);
      return resolve(res);
    });
  });
  return pdfCreated;
};

// Function to send pdf file
exports.sendPDF = async (data, name) => {
  let pdf = await new Promise((resolve, reject) => {
    createPDF(data, name).then(value => {
      fs.readFile(`./pdf/${name}.pdf`, function(error, data) {
        if (error) {
          return reject(error);
        } else {
          return resolve(data);
        }
      });
    });
  });
  return pdf;
};

// Function to create csv file
const createCSV = async (data, name) => {
  let csvFile = await new Promise((resolve, reject) => {
    fs.writeFile(`./csv/${name}.csv`, data, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
  return csvFile;
};

// Function used in controller to send csv file
exports.sendCSV = async (data, name) => {
  let csv = await new Promise((resolve, reject) => {
    createCSV(data, name)
      .then(value => {
        fs.readFile(`./csv/${name}.csv`, (error, data) => {
          if (error) return reject(error);
          return resolve(data);
        });
      })
      .catch(err => console.log(err));
  });
  return csv;
};
