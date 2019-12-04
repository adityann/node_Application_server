
const logger = require("../../startup/logger");
const mysql_ddl = require('../../util/db/mysql/mysql_ddl');
const mysql_client = require('../../util/db/mysql/mysql_client');
const initData = require('../../startup/init');
const cassandraDriver = require('cassandra-driver');
const TimeUuid = cassandraDriver.types.TimeUuid;

module.exports = {
    setOrClearAlert: setOrClearAlert,
    updateAlertPriorityStatusRedis

}

/**
 * 
 * @param {*} redisResponse 
 */
function setOrClearAlert(redisResponse) {
    let alertList = Object.keys(redisResponse.alerts);

    alertList.forEach((element) => {
        switch (element) {
            case "washTooLow":
                if (redisResponse.hygiene.average.washTemp > 0) {
                    redisResponse = checkAlert(redisResponse, redisResponse.hygiene.average.washTemp, element, true);
                }
                break;
            case "washTooHigh":
                if (redisResponse.hygiene.average.washTemp > 0) {
                    redisResponse = checkAlert(redisResponse, redisResponse.hygiene.average.washTemp, element, false);
                }
                break;
            case "rinseTooLow":
                if (redisResponse.hygiene.average.rinseTemp > 0) {
                    redisResponse = checkAlert(redisResponse, redisResponse.hygiene.average.rinseTemp, element, true);
                }
                break;
            case "rinseTooHigh":
                if (redisResponse.hygiene.average.rinseTemp > 0) {
                    redisResponse = checkAlert(redisResponse, redisResponse.hygiene.average.rinseTemp, element, false);
                }
                break;
            case "conductivityTooLow":
                if (redisResponse.hygiene.average.detergentC > 0) {
                    redisResponse = checkAlert(redisResponse, redisResponse.hygiene.average.detergentC, element, true);
                }
                break;
            case "conductivityTooHigh":
                if (redisResponse.hygiene.average.detergentC > 0) {
                    redisResponse = checkAlert(redisResponse, redisResponse.hygiene.average.detergentC, element, false);
                }
                break;
            case "preWashTooLow":
                if (redisResponse.hygiene.average.preWash > 0) {
                    redisResponse = checkAlert(redisResponse, redisResponse.hygiene.average.preWash, element, true);
                }
                break;
            case "preWashTooHigh":
                if (redisResponse.hygiene.average.preWash > 0) {
                    redisResponse = checkAlert(redisResponse, redisResponse.hygiene.average.preWash, element, false);
                }
                break;
            default: break;
        }
    })
    return redisResponse;
}

/**
 * 
 * @param {*} redisResponse 
 * @param {kpi value} value 
 * @param {alert name} alert 
 * @param {Temperature low indicator} lowFlag 
 */
function checkAlert(redisResponse, value, alert, lowFlag) {
    if (value > 0 && redisResponse.alerts[alert].thresholdValue > 0) {
        if ((lowFlag == true && value >= redisResponse.alerts[alert].thresholdValue) || (lowFlag == false && value <= redisResponse.alerts[alert].thresholdValue)) {
            if (redisResponse.alerts[alert].counter > 0) {
                redisResponse.alerts[alert].counter = redisResponse.alerts[alert].counter - 1;
            }
        } else {
            redisResponse.alerts[alert].counter = redisResponse.alerts[alert].counter + 1;
        }

        if (redisResponse.alerts[alert].status == "set") {
            if (redisResponse.alerts[alert].counter == 0) {
                redisResponse.dbUpdate.alert[alert] = 1;
                redisResponse.alerts[alert].status = "clear";
                redisResponse.alerts[alert].counter = 0;
                logger.debug(`fn:checkAlert alert:${alert} status:${redisResponse.alerts[alert].status}`);
                return redisResponse;
            }
        } else {
            if (redisResponse.alerts[alert].setCounter == redisResponse.alerts[alert].counter) {
                let timeuuid = TimeUuid.now();
                initData.alertCount = initData.alertCount + 1;
                redisResponse.alerts[alert].id = initData.alertCount;
                redisResponse.alerts[alert].timeUuid = timeuuid.toString();
                redisResponse.dbUpdate.alert[alert] = 1;
                redisResponse.alerts[alert].status = "set";
                redisResponse.alerts[alert].counter = redisResponse.alerts[alert].clearCounter;
                logger.debug(`fn:checkAlert alert:${alert} status:${redisResponse.alerts[alert].status}`);
                return redisResponse;
            }
        }
    }
    return redisResponse;
}


/**
 * 
 * @param {*} resolve 
 * @param {*} reject 
 * @param {*} redisResponse 
 */
function updateAlertPriorityStatusRedis(resolve, reject, redisResponse) {
    
        let alerts = redisResponse.alerts;
        let machineId = redisResponse.machineId;

        let globalSettingsData = new Promise((resolve, reject) => getGlobalAlertFilter(machineId, resolve, reject));
        globalSettingsData.then(data => {
            if (data) {
                data = convertArrayToObj(data);
                Object.keys(alerts).forEach(key => {
                    if (data[key] && camelize(data[key].alert) == key) {
                        alerts[key].issueType = data[key].issue_type;
                        alerts[key].priority = data[key].priority;
                        alerts[key].name = data[key].alert_name;
                        alerts[key].setCounter = data[key].wash_cycle_count_set;
                        alerts[key].clearCounter = data[key].wash_cycle_count_clear;
                    }
                });
            }
            let thresholdData = new Promise((resolve, reject) => getThresholdsByMacId(machineId, resolve, reject));
            thresholdData.then(data => {
                alerts = setThresholdValues(data, alerts);
                resolve(alerts);
            }).catch(err => {
                reject(err);
            });
        }).catch(err => {
            reject(err);
        });

    // })
}

/**
 * 
 * @param {*} machineId 
 * @param {*} resolve 
 * @param {*} reject 
 */
function getThresholdsByMacId(machineId, resolve, reject) {
    try {
        if (machineId) {
            let param = machineId;
            mysql_client.executeQueryParams(mysql_ddl.select.getThresoldValues, param, (error, rows) => {
                if (error) reject(err);
                logger.info(`method:Threshold fetch for MachineId: `);
                resolve(rows);
            });
        } else {
            resolve();
        }
    } catch (e) {
        logger.error("fn:method:Threshold fetch for MachineId: " + JSON.stringify(e));
        reject(e);
    }
}

/**
 * 
 * @param {*} machineId 
 * @param {*} resolve 
 * @param {*} reject 
 */
function getGlobalAlertFilter(machineId, resolve, reject) {
    try {
        if (machineId) {
            let param = machineId;
            mysql_client.executeQueryParams(mysql_ddl.select.getGlobalAlertFilter, param, (error, rows) => {
                if (error) reject(error);
                logger.info(`method: Global Alert Status:`)
                resolve(rows);
            });
        } else {
            resolve();
        }
    } catch (e) {
        logger.error("fn::Error in Mysql 'Global Alert' description:" + JSON.stringify(e));
        reject(e);
    }
}

/**
 * 
 * @param {*} array 
 */
function convertArrayToObj(array) {
    let obj = {};
    array.map(d => {
        let arrayItemObj = {};
        arrayItemObj[camelize(d.alert)] = d;
        Object.assign(obj, arrayItemObj);
    })
    return obj;
}


/**
 * 
 * @param {*} value 
 * @param {*} alerts 
 */
function setThresholdValues(value, alerts) {
    let obj = {};
    value.map(d => {
        if (d.adjusted_value_used && d.adjusted_value_used == 1) {
            obj[d.alarm_type + ' Low'] = d.adjusted_min_value;
            obj[d.alarm_type + ' High'] = d.adjusted_max_value;
        } else {
            obj[d.alarm_type + ' Low'] = d.default_min_value;
            obj[d.alarm_type + ' High'] = d.default_max_value;
        }
    });
    Object.keys(alerts).forEach(key => {
        if (obj[alerts[key].name]) {
            alerts[key].thresholdValue = obj[alerts[key].name];
        }
    });
    return alerts;
}



/**
 * Camelize a string, cutting the string by multiple separators like
 * hyphens, underscores and spaces.
 * 
 * @param {text} string Text to camelize
 * @return string Camelized text
 */
function camelize(text) {
    return text.replace(/^([A-Z])|[\s-_]+(\w)/g, function (match, p1, p2, offset) {
        if (p2) return p2.toUpperCase();
        return p1.toLowerCase();
    });
}