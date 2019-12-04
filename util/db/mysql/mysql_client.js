const logger = require('../../../startup/logger');
const pool_connection = require('../../../startup/mySqlConnection');

// function for MySql DataBase
module.exports = {
    executeQuery: executeQuery,
    executeQueryParams: executeQueryParams,
    executeQuery_Promise: executeQuery_Promise,
    close_poll_connection: close_poll_connection
};

/**
 * 
 * @param {} query 
 * @param {*} callback 
 */

function executeQuery(query, callback) {
    pool_connection.getConnection(function (err, connection) {
        try {
            if (err) {
                logger.error(`method:executeQuery message:error in connection.query for schema '${query}' error:${err}`);
            } else {
                connection.query(query, function (err, rows) {
                    connection.release();
                    if (err) {
                        logger.error(`method:executeQuery message:error in connection.query for schema '${query}' error:${err}`);
                    }
                    callback(err, rows);
                });
                connection.on('error', function (err) {
                    logger.error(`method:executeQuery message:error in connection.query for schema '${query}' error:${err}`);
                    callback(err, null);
                });
            }
        } catch (err) {
            logger.error(`method:executeQuery message:error in connection.query for schema '${query}' error:${err}`);
            callback(err, null);
        }
    });
}
/**
 * 
 * @param {*} query 
 * @param {*} params 
 * @param {*} callback 
 */

function executeQueryParams(query, params, callback) {
    params = params.split(',');

    pool_connection.getConnection(function (err, connection) {
        try {
            if (err) {
                callback(err, null);
            } else {
                connection.query(query, params, function (err, rows) {
                    connection.release();
                    if (err) {
                        logger.error(`method:executeQueryParams message:error in connection.query for schema '${query}' error:${String(err)}`);
                    } else {
                        logger.info(`method:executeQueryParams message:updated  '${query}'`);
                    }
                    callback(err, rows);
                });
                connection.on('error', function (err) {
                    logger.info(`method:executeQueryParams message:error in connection.query error:'${JSON.stringify(err)}'`);
                    callback(err, null);
                });

            }
        } catch (err) {
            //apiLoggger.loggerError(utillog.format(" Catch Error  for schema '%s' ERRROR :: -%s", schema, err));
            callback(err, null);
        }
    });
}

/**
 * Returns a promise for execution of query
 * @param {*} query 
 * @param {*} params 
 */
function executeQuery_Promise(query, params) {
    return new Promise((resolve, reject)=>{
        pool_connection.getConnection(function (err, connection) {
            try {
                if (err) {
                    reject(`methord:executeQuery message:error in connection.query for schema '${query}' error:${err}`);
                } else {
                    connection.query(query, params, function (err, rows) {
                        connection.release();
                        if (err) {
                            reject(`methord:executeQuery message:error in connection.query for schema '${query}' error:${err}`);
                        }
                        resolve(rows);
                    });
                    connection.on('error', function (err) {
                        reject(`methord:executeQuery message:error in connection.query for schema '${query}' error:${err}`);
                    });
                }
            } catch (err) {
                reject(`methord:executeQuery message:error in connection.query for schema '${query}' error:${err}`);
            }
        });
    })
}



// close all pool connection 
function close_poll_connection() {
    pool_connection.end(function (err) {
        // all connections in the pool have ended
        if (err) {
            logger.error("Error while closeing DB connections in the pool");
        } else {
            logger.info("All DB connections in the pool have ended");
        }
    });
}