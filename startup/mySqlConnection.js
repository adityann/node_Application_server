const mysql = require('mysql');
//api-hub Logger
const logger = require('./logger');

const mysqlOption = {
    connectionLimit: 10,
    host: process.env.mysqlHost,
    user: process.env.mysqlUser,
    port: process.env.mysqlPort,
    password: process.env.mysqlPassword,
    database: process.env.mysqlDatabase
}

const pool_connection = mysql.createPool(mysqlOption);
/**
 * 
 */
pool_connection.getConnection(function (err, connected) {
    if (err) {
        logger.error(`"MySql Connection error"  error:${err}`);
    }
    logger.info(`"MySql Connected"`);
});

pool_connection.on('error', function (err) {
    logger.error(`method:MySqlConnected message:eroor in Mysql connection pool error:${err}`);
});

/**
 * The pool will emit a connection event when a new connection is made within the pool
 */
pool_connection.on('connection', function (connection) {
    if (connection) {
        //   logger.info('method:MySql connected as id ' + connection.threadId);
    }
});

/**
 * The pool will emit an acquire event when a connection is acquired from the pool. 
 * This is called after all acquiring activity has been performed on the connection,
 * right before the connection is handed to the callback of the acquiring code.
 */
pool_connection.on('acquire', function (connection) {
    // logger.info(`method:MySql Connection ${connection.threadId} acquired.`);
});

/**
 * The pool will emit an enqueue event when a callback has been queued to wait for an available connection.
 */
pool_connection.on('enqueue', function () {
    //  logger.info('Waiting for available connection slot');
});

module.exports = pool_connection