/**
 * reading the given excel and creating object for each rows
 */

 /*
require('dotenv').config({
    silent: true
});

const mysql = require('mysql');
//api-hub Logger

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.mysqlHost,
    user: process.env.mysqlUser,
    port: process.env.mysqlPort,
    password: process.env.mysqlPassword,
    database: process.env.mysqlDatabase
});
var Excel = require('exceljs');
//const logger = require('../startup/logger');
var mySqlCon = require('../util/db/mysql/mysql_client');
//var countryNameList = [];
//var formateList = [];
var workbook = new Excel.Workbook();
workbook.xlsx.readFile("./test/testPac.xlsx")
    .then(function () {
        var worksheet = workbook.getWorksheet(1);

        worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
            let params = [row.getCell(1).value, row.getCell(2).value, row.getCell(3).value, row.getCell(4).value, row.getCell(5).value, row.getCell(6).value, row.getCell(7).value, row.getCell(8).value, row.getCell(9).value, row.getCell(10).value, row.getCell(11).value, row.getCell(12).value, row.getCell(13).value];

            //console.log(params);

            var query = "Insert into intellidish.units_measures(locale, language_code, licd, date_format, time_format, temperature, currency , number_format, mass_unit, length_unit, area_unit, volume_unit, electrical_energy_unit) values(?,?,?,?,?,?,?,?,?,?,?,?,?)";
            try {

                pool.getConnection(function (err, connection) {
                    if (err) throw err; // not connected!

                    // Use the connection
                    connection.query(query, params, function (error, results, fields) {
                        // When done with the connection, release it.
                        connection.release();

                        // Handle error after the release.
                        if (error) throw error;

                        // Don't use the connection here, it has been returned to the pool.
                    });
                });
            } catch (e) {

            }

        });


    })
process.on('unhandledRejection', (reason, p) => {
    console.error(`unhandledRejection, reason:${reason} Error:${p}`);
    //  process.kill(process.pid);
});
*/