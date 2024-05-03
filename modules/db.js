const mysql = require("mysql2");

 const connection = mysql.createConnection({
   host: "114.29.238.22",
   user: "semperxyz",
   password: "semperxyz",
   database: "evalucall-database",
 });

//const connection = mysql.createConnection({
//  host: "127.0.0.1",
//  user: "root",
//  password: "",
//  database: "evalucall-database",
//});

function executeQuery(query, values, callback) {
  connection.query(query, values, (error, results) => {
    if (error) {
      callback(error, null);
      return;
    }
    callback(null, results);
  });
}

module.exports = { executeQuery, connection };

// To import
// const connection = require("../modules/db");
