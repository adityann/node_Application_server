const cassandraConnection = require('../../../startup/cassandraConnection');

const cassandra_ddl = require('./cassandra_ddl');
const utils = require("../../../util/utils");
const logger = require('../../../startup/logger');
const time = require('../../utils');




module.exports = {
    db_Select: db_Select,
    dB_Insert: dB_Insert,
    db_update: db_update,
    streamQuery: streamQuery,
    updateParametersRealtime: updateParametersRealtime,
    machineKpi: machineKpi,
    lookUPCassandraRedis: lookUPCassandraRedis,
    alerts: alerts


};


function lookUPCassandraRedis(macId, todayDate, callback) {
    const params = [macId, todayDate];
    let currentTime = Date.now()
    cassandraConnection.execute(cassandra_ddl.select.lookUPCassandraQueryRedis, params, {
        prepare: true
    }, function (err, result) {
        if (err) {
            logger.error(`fn:lookUPCassandra machineId:${macId} params:'${params}' message:${String(err)} `);
            callback(err, null);
        } else if (result.rows.length == 0) {
            logger.info(`fn:lookUPCassandra machineId:${macId} params:'${params}' message:'NULL row' data:${result.rows} Time: ${time.getExecutionTime(currentTime)} `);
            callback(null, "NO-DATA");
        } else {
            logger.debug(`fn:lookUPCassandra machineId:${macId} params:'${params}' message:'db sucess  Time:${time.getExecutionTime(currentTime)}'`);
            callback(null, result.rows);
        }
    });
}


function machineKpi(redisResponseObject, callback) {
    let queries = queriesParamsArrays(redisResponseObject);

    logger.debug("machineKpi-------------->\n" + JSON.stringify(queries) + '\n' + JSON.stringify(redisResponseObject.dbUpdate));

    if (queries.length > 0) {
        cassandraConnection.batch(queries, {
            prepare: true
        }, (err, response) => {
            if (err) {
                logger.error(`machineKpi-${redisResponseObject.key}  errorDescription:${JSON.stringify(err)} queries:${JSON.stringify(queries)}`);
                callback(err, null);
            } else {
                logger.debug(`machineKpi-${redisResponseObject.key}  message:"machine Kpi" `);
                callback(null, response);
            }
        });
    } else {
        logger.warn(`machineKpi-${redisResponseObject.key} queries:${JSON.stringify(queries)}`);
        callback("queries is null", null);
    }
}

function queriesParamsArrays(redisResponse) {
    let queries = [];
    Object.keys(redisResponse.dbUpdate).forEach(function (key) {
        if (redisResponse.dbUpdate[key] == 1) {
            let getQuerieParamsObject = getQuerieParams(key, redisResponse)
            //     logger.warn("key--->" + key + "queriesObject[key]--->" + JSON.stringify(getQuerieParamsObject));
            if (getQuerieParamsObject != undefined) {
                queries.push(getQuerieParamsObject);
            }
        }
    })
    return queries;
}



function getQuerieParams(key, redisResponse) {
    let querieParams;
    let machineKpiQuery = cassandra_ddl.insert.machineKpi;

    switch (key) {
        case "accWashTime":
            querieParams = {
                query: machineKpiQuery,
                params: [redisResponse.washTime, redisResponse.washTime, redisResponse.machineId, 'wash_time', redisResponse.currentDate]
            }
            break;
        case "accEnergyConsumption":
            let energyConsumption = utils.toFixed(redisResponse.energyConsumption.totalEnergy, 2);
            querieParams = {
                query: machineKpiQuery,
                params: [energyConsumption, energyConsumption, redisResponse.machineId, 'energy_consumption', redisResponse.currentDate]
            }
            break;

        case "accRinseWater":
            querieParams = {
                query: machineKpiQuery,
                params: [redisResponse.rinseCalculation.totalRinseWater, utils.litreGallon(redisResponse.rinseCalculation.totalRinseWater), redisResponse.machineId, 'rinse_water', redisResponse.currentDate]
            }
            break;
        case "accRinseWaterWashing":
            querieParams = {
                query: machineKpiQuery,
                params: [redisResponse.rinseCalculation.rinseWaterWashing, utils.litreGallon(redisResponse.rinseCalculation.rinseWaterWashing), redisResponse.machineId, 'rinse_water_washing', redisResponse.currentDate]
            }
            break;
        case "accRinseWaterFilling":
            querieParams = {
                query: machineKpiQuery,
                params: [redisResponse.rinseCalculation.rinseWaterFilling, utils.litreGallon(redisResponse.rinseCalculation.rinseWaterFilling), redisResponse.machineId, 'rinse_water_filling', redisResponse.currentDate]
            }
            break;
        case "accRinsetime":
            querieParams = {
                query: machineKpiQuery,
                params: [redisResponse.rinseTime, redisResponse.rinseTime, redisResponse.machineId, 'rinse_time', redisResponse.currentDate]
            }
            break;
        case "accUsageEffiency":
            let usageEffiency = utils.toFixed(redisResponse.usageEfficiency, 2);
            querieParams = {
                query: machineKpiQuery,
                params: [usageEffiency, usageEffiency, redisResponse.machineId, 'machine_efficiency', redisResponse.currentDate]
            }
            break;
        case "accWashCycles":
            querieParams = {
                query: machineKpiQuery,
                params: [redisResponse.washCycle, redisResponse.washCycle, redisResponse.machineId, 'wash_cycle', redisResponse.currentDate]
            }
            break;
        case "accFillWater":
            querieParams = {
                query: machineKpiQuery,
                params: [redisResponse.fillWater.totalFillWater, utils.litreGallon(redisResponse.fillWater.totalFillWater), redisResponse.machineId, 'fill_water', redisResponse.currentDate]
            }
            break;
        case "accFillCount":
            querieParams = {
                query: machineKpiQuery,
                params: [redisResponse.fillWater.waterFillCount, redisResponse.fillWater.waterFillCount, redisResponse.machineId, 'fill_cycle', redisResponse.currentDate]
            }
            break;
        case "avgRinseWaterFlowRate":
            querieParams = {
                query: machineKpiQuery,
                params: [utils.toFixed(redisResponse.rinseCalculation.avgRinseWaterflowRate, 2), utils.litreGallon(redisResponse.rinseCalculation.avgRinseWaterflowRate), redisResponse.machineId, 'avg_rinse_water_flow_rate', redisResponse.currentDate]
            }
            break;
        case 'hygiene':
            let site_time = utils.currentDateTime(redisResponse.timeStamp, redisResponse.machineId);
            if (site_time) {
                querieParams = {
                    query: cassandra_ddl.insert.parametersHygiene,
                    params: [redisResponse.hygiene.average.preWash, utils.celsiusFahrenheit(redisResponse.hygiene.average.preWash), redisResponse.hygiene.average.washTemp, utils.celsiusFahrenheit(redisResponse.hygiene.average.washTemp), redisResponse.hygiene.average.rinseTemp, utils.celsiusFahrenheit(redisResponse.hygiene.average.rinseTemp), redisResponse.hygiene.average.detergentC, redisResponse.timeStamp, site_time, redisResponse.machineId, redisResponse.washCycle]
                }
            } else {
                return;
            }
            break;
        // case 'rinseTooLow':
        //     cassandraConnection.execute('SELECT max(alert_id) as count FROM alerts;', (err, alertCount) => {
        //         if (err) {
        //             logger.error(`fn:getQuerieParams message: Error retrieving alert count error:${JSON.stringify(err)} `)
        //             //reject(err);
        //         }
        //         
        //     })

        //     let time = utils.currentDateTime(redisResponse.timeStamp, redisResponse.machineId);
        //     if (time) {
        //         querieParams = {
        //             query: cassandra_ddl.insert.setAlert,
        //             params: [redisResponse.machineId, 1, redisResponse.alerts[key].name, redisResponse.alerts[key].issueType,
        //             redisResponse.alerts[key].priority, redisResponse.alerts[key].setCounter, time]
        //         }
        //     } else {
        //         return;
        //     }
        //     break;


        default:
            return;
    }
    return querieParams;
}


function alertsGetQueryParams(key, redisResponse) {
    logger.info("alertsGetQueryParams()", key);
    switch (key) {
        case 'washTooLow':
            let site_time = utils.currentDateTime(redisResponse.timeStamp, redisResponse.machineId);
            if (site_time) {
                querieParams = {
                    query: cassandra_ddl.insert.setAlert,
                    params: [redisResponse.machineId, 1, redisResponse.alerts[key].name, redisResponse.alerts[key].issueType,
                    redisResponse.alerts[key].priority, redisResponse.alerts[key].setCounter, site_time]
                }
            } else {
                return;
            }
            break;
    }
}




/**
 * 
 * @param {machine Id} mid 
 * @param {unique Id} uuid 
 * @param {*} site_time 
 * @param {*} epocTime 
 * @param {*} columnName 
 * @param {*} columnValue 
 * @param {*} callback 
 */

function updateParametersRealtime(mid, uuid, site_time, epocTime, parametersRealtimeObject, alarmThresholdParams, callback) {
    let message;
    let querieParams;
    //  try {
    if (parametersRealtimeObject) {
        site_time = site_time.replace(/T|Z/g, ' ').trim() + "+0000"
        message = `${mid}-${epocTime}-${uuid}/${site_time}`;

        querieParams = [{
            query: cassandra_ddl.update.parametersRealtimeByMIdEpoc + uuid,
            params: [utils.toFixed(parametersRealtimeObject.totalEnergy, 2),
            parametersRealtimeObject.totalFillWater,
            utils.litreGallon(parametersRealtimeObject.totalFillWater),
            parametersRealtimeObject.totalRinseWater,
            utils.litreGallon(parametersRealtimeObject.totalRinseWater),
            utils.toFixed(parametersRealtimeObject.usageEfficiency, 2),
            parametersRealtimeObject.waterFillCount,
                mid, site_time
            ]
        }, {
            query: cassandra_ddl.update.alarmThreshold_accAvgRinseWaterflowRate + uuid,
            params: alarmThresholdParams

        }]

        cassandraConnection.batch(querieParams, {
            prepare: true
        }, (err) => {
            if (err) {
                logger.error(`fn:updparamparamateParametersRealtime-error:${message} err:${JSON.stringify(err)} querieParams:${JSON.stringify(querieParams)} "`);
                // throw err
                callback(err, null)
            } else {
                logger.debug(`fn:updateParametersRealtime-sucess:-${message} "`);
                callback(null, "Sucess")
            }
        });
    } else {
        logger.error(`fn:updateParametersRealtime-error:${message} message:parms is NULL err:${JSON.stringify(err)}"`);

        callback("parms is NULL", null);
    }
    // } catch (err) {
    //     logger.error(`fn:updparamparamateParametersRealtime-error:${message} err:${JSON.stringify(err)} querieParams:${JSON.stringify(querieParams)} "`);
    //     callback(err, null);
    // }
}




function alerts(redisResponse, callback) {
    let queries = []

    let time = utils.currentDateTime(redisResponse.timeStamp, redisResponse.machineId);

    if (time) {
        Object.keys(redisResponse.dbUpdate.alert).forEach(function (key) {
            let querieParams = '';
            if (redisResponse.dbUpdate.alert[key] == 1) {
                if (redisResponse.alerts[key].status == 'set') {
                    querieParams = {
                        query: cassandra_ddl.insert.setAlert,
                        params: [ redisResponse.alerts[key].timeUuid, redisResponse.machineId, redisResponse.alerts[key].id, redisResponse.alerts[key].name, redisResponse.alerts[key].issueType,
                        redisResponse.alerts[key].priority, redisResponse.alerts[key].setCounter, time]
                    }
                } else {
                    querieParams = {
                        query: cassandra_ddl.update.clearAlert + redisResponse.alerts[key].timeUuid,
                        params: [time, 'Issue Cleared', redisResponse.alerts[key].clearCounter, redisResponse.alerts[key].id, redisResponse.machineId]
                    }
                }
                queries.push(querieParams);
            }
        });

        if (queries.length > 0) {
            cassandraConnection.batch(queries, {
                prepare: true
            }, (err) => {
                if (err) {
                    logger.error(`fn:alerts err:${JSON.stringify(err)} query:${JSON.stringify(queries)} "`);
                    // throw err
                    callback(err, null);
                } else {
                    logger.debug(`fn:alerts message: Alerts logged "`);
                    callback(null, "Sucess")
                }
            });
        }
    } else {
        //logger.error(`fn:alerts error:Error in site_time calculation`);
        callback(`fn:alerts error:Error in site_time calculation`, null);
    }
}




/**
 * 
 * @param {*} queries // 
 * queries = [{
    query: 'UPDATE user_profiles SET email=? WHERE key=?',
    params: [ emailAddress, 'hendrix' ]
  },
  {
    query: 'INSERT INTO user_track (key, text, date) VALUES (?, ?, ?)',
    params: [ 'hendrix', 'Changed email', new Date() ]
  }];
 * @param {*} callback 
 */
function batchStatements(queries, callback) {
    cassandraConnection.batch(queries, {
        prepare: true
    }, function (err, results) {
        if (err) {
            logger.error(`fn:batchStatements message:"Cassandra" queries:${JSON.stringify(queries)} message:${JSON.stringify(err)} `);
            return callback(err, null);
        }
        // All queries have been executed successfully
        callback(null, results);
    });
}


async function streamQuery(objects, callback) {
    var resData = [];

    await cassandraConnection.stream(objects.query, objects.params, objects.options)
        .on('readable', function () {
            let row;
            // 'readable' is emitted as soon a row is received and parsed
            while (row = this.read()) {
                resData.push(row);
            }
        })
        .on('end', function () {
            // Stream ended, there aren't any more rows
            callback(null, resData);
        })
        .on('error', function (err) {
            // Something went wrong: err is a response error from Cassandra
            callback(err, null);
        });
}


/**
 * 
 * @param {*} query 
 * @param {*} params 
 * @param {*} callback 
 */
function dB_Insert(query, params, callback) {
    cassandraConnection.execute(query, params, {
        prepare: true
    }, function (err, dbResponce) {
        callback(err, dbResponce);
    });
}
/**
 * 
 * @param {*} selectQuery 
 * @param {*} params 
 * @param {*} cb 
 */
function db_Select(selectQuery, params, cb) {
    cassandraConnection.execute(selectQuery, params, {
        prepare: true
    }, function (err, result) {
        // Run next function 
        cb(err, result);
    });
}

/**
 * 
 * @param {*} query  -- Sql query
 * @param {*} params --[]
 * @param {*} callback 
 */
function db_update(query, params, cb) {
    cassandraConnection.execute(query, params, {
        prepare: true
    }, function (err, Response) {
        cb(err, Response)
    })
}