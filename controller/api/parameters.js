const cassandra_client = require("../../util/db/cassandra/cassandra_client");
const cassandra_ddl = require("../../util/db/cassandra/cassandra_ddl");
const tryCatch = require('../../middeleware/tryCatch');
const apiResponse = require('../../util/lib/apiResponse');
const mySqlLoad = require('../../startup/init');
const utils = require('../../util/utils');
const Joi = require('joi');
const logger = require('../../startup/logger');

let options = {
    autoPage: true,
    traceQuery: true,
    prepare: true
};
//1970-01-18 21:15 	"from":"2016-07-27 07:45",

const schema = Joi.object().keys({
    macId: Joi.string().alphanum().min(3).max(30).required(),
    from: Joi.date().required(),
    to: Joi.date().min(Joi.ref('from')).required()
});

const parameters_schema = Joi.object().keys({
    macId: Joi.string().alphanum().min(3).max(30).required(),
    from: Joi.date().required(),
    to: Joi.date().min(Joi.ref('from')).required(),
    locale: Joi.string().required()
});

let newObjectSummary = {
    energy_consumption: 0,
    fill_cycle: 0,
    fill_water: 0,
    machine_efficiency: 0,
    rinse_water: 0,
    wash_cycle: 0,
    wash_time: 0,
};
/**
 * 
 */

exports.getRealTimeByMacId = tryCatch(async (req, res, next) => {
    let body = req.body;
    let payload = {
        macId: body.macId,
        from: body.from,
        to: body.to,
        locale: body.locale.toString().toLowerCase()
    }
    // Return result.
    const validate = Joi.validate(payload, parameters_schema);

    if (!validate.error) {
        let sensorObject = checkSensorRealTime(payload.macId);
        let query = '';
        if (payload.locale == 'en-us') {
            query = cassandra_ddl.select.getParametersRealTimeByMacId_F;
        } else {
            query = cassandra_ddl.select.getParametersRealTimeByMacId;
        }
        let params = [payload.macId, payload.from + '.000+0000', payload.to + '.000+0000'];

        cassandra_client.streamQuery({
            query: query,
            params: params,
            options: options
        }, (err, dbResponse) => {
            if (err) {
                next(err)
            } else {
                let resData = apiResponse.response('success', 200, '', dbResponse);
                if (sensorObject) resData = Object.assign(resData, sensorObject);
                res.status(200);
                res.send(resData);
            }
        })
    } else {
        res.status(400);
        res.send(apiResponse.response('error', 400, validate.error.details[0].message));
    }
});


exports.getSummeryByMacId = tryCatch(async (req, res, next) => {
    let body = req.body;
    let payload = {
        macId: body.macId,
        from: body.from,
        to: body.to
    }
    const locale = body.locale ? body.locale : '';
    // Return result.
    const validate = Joi.validate(payload, schema);

    if (!validate.error) {
        let query;
        if (locale && locale.toLowerCase() === 'en-us') {
            query = cassandra_ddl.select.getMachineKpiMacIdForUS;
        } else {
            query = cassandra_ddl.select.getMachineKpiMacId;
        }
        let params = [payload.macId, payload.from, payload.to];
        cassandra_client.db_Select(query, params, (err, dbResponse) => {
            if (err) {
                next(err)
            } else {
                let newReaponse = [];
                let tempDate;
                let newObject;
                dbResponse.rows.forEach((obj, index) => {
                    let date = obj.date.toString();
                    if (obj.kpi != 'fill_cycle') {
                        if (tempDate == date) {
                            newObject[obj.kpi] = obj.value;
                            if (dbResponse.rows.length == index + 1) {
                                let r = Object.assign({}, newObjectSummary, newObject)
                                newReaponse.push(r);
                            }
                        } else if (tempDate != date) {
                            tempDate = date;
                            if (newObject) {
                                let r = Object.assign({}, newObjectSummary, newObject)
                                newReaponse.push(r);
                            }
                            newObject = {};
                            newObject.date = date;
                            newObject[obj.kpi] = obj.value;
                        }
                    }
                });
                res.status(200);
                res.send(apiResponse.response('success', 200, '', newReaponse));
            }
        })
    } else {
        res.status(400);
        res.send(apiResponse.response('error', 400, validate.error.details[0].message));
    }
});


function checkSensorHyg(machine_id) {
    let obj = {};
    try {
        const checkSensorList = utils.filterByMultipleKeysValues(mySqlLoad.machineInstalledSensorList, {
            'device_id': machine_id,
            "sensor_name": "WashTemperatureProbe,RinseTemperatureProbe,ConductivityProbe,PreWashTemperatureProbe"
        });
        checkSensorList.forEach(checkSensor => {
            obj[checkSensor.sensor_name] = (checkSensor.status == 1) ? true : false;
        });
        return obj;
    } catch (e) {
        return null;
    }
}

/*
    Retrieve Parameter Hygiene data by machine for a period of time.
    Table - intellidish.parameters_hygiene (Cassandra)
*/

exports.getParameterHygieneByMacId = tryCatch(async (req, res, next) => {
    let body = req.body;
    let payload = {
        macId: body.macId,
        from: body.from,
        to: body.to,
        locale: body.locale.toString().toLowerCase()
    }

    let validate = Joi.validate(payload, parameters_schema);

    if (!validate.error) {
        let status = checkSensorHyg(payload.macId);
        let params = [payload.macId, payload.from + '.000+0000', payload.to + '.000+0000'];
        let query = '';

        if (payload.locale == 'en-us') {
            query = cassandra_ddl.select.getParameterHygieneKpiMacId_F;
        } else {
            query = cassandra_ddl.select.getParameterHygieneKpiMacId_C;
        }

        cassandra_client.db_Select(query, params, (err, dbResponse) => {
            if (err) {
                next(err)
            } else {
                let resData = apiResponse.response('success', 200, '', dbResponse.rows);
                resData.sensorStatus = status;
                res.status(200);
                res.send(resData);
            }
        })
    } else {
        res.status(400);
        res.send(apiResponse.response('error', 400, validate.error.details[0].message));
    }
});

//alarmthreshholdTempList
exports.getAlarmThreshHoldByMacId = tryCatch(async (req, res, next) => {
    let macId = req.params.macId;
    if (macId) {
        let alarmthreshhold = utils.filterByMultipleKeysValues(mySqlLoad.alarmthreshholdTempList, {
            'machine_system_id': macId
        });
        let data = {};
        if (alarmthreshhold) {
            alarmthreshhold.forEach(element => {
                let key = element.alarm_type.split(' ').join('_');
                // if (key.match(/Rinse_Water/i)) {
                //     key = 'Rinse_Water';
                // }
                data[key] = {};
                data[key].min = element.default_min_value;
                data[key].max = element.default_max_value;

            });
        }
        res.status(200);
        res.send(apiResponse.response('success', 200, '', data));
    } else {
        res.status(400);
        res.send(apiResponse.response('error', 400, "macId Required"));
    }

});

// To get the sensor data from Master data for the particular MacId
exports.getSensorDataByMacId = tryCatch(async (req, res, next) => {
    let macId = req.params.macId;
    if (macId) {
        let data = {};
        let sensorData = getSensorData(macId);
        if (sensorData) {
            data['sensorData'] = sensorData;
        }
        const alarmthreshhold = getAlarmThresholdData(macId);
        if (alarmthreshhold) {
            data['thresholdData'] = alarmthreshhold;
        }
        res.status(200);
        res.send(apiResponse.response('success', 200, '', data));
    } else {
        res.status(400);
        res.send(apiResponse.response('error', 400, "macId Required"));
    }
});

// Fetching sensor details from MySQL
function getSensorData(machine_id) {
    let obj = {};
    let checkStatus = false;
    try {
        const checkSensorList = utils.filterByMultipleKeysValues(mySqlLoad.machineInstalledSensorList, {
            'device_id': machine_id,
            "sensor_name": "WashTemperatureProbe,RinseTemperatureProbe,ConductivityProbe,PreWashTemperatureProbe,EnergyMeter,DrainSwitch,WashTrigger,RinseTrigger"
        });
        checkSensorList.forEach(checkSensor => {
            if (checkStatus == false) {
                checkStatus = true;
            }
            obj[checkSensor.sensor_name] = (checkSensor.status == 1) ? true : false;
        });
        if (checkStatus) {
            return obj;
        } else {
            return null;
        }
    } catch (e) {
        return null;
    }
}

// Fetching Threshold details from MySQL
function getAlarmThresholdData(machine_id) {
    let checkStatus = false;
    let alarmthreshhold = utils.filterByMultipleKeysValues(mySqlLoad.alarmthreshholdTempList, {
        'machine_system_id': machine_id
    });
    let thresholdData = {}
    if (alarmthreshhold) {
        alarmthreshhold.forEach(element => {
            if (checkStatus == false) {
                checkStatus = true;
            }
            let key = element.alarm_type.split(' ').join('_');
            thresholdData[key] = {};
            thresholdData[key].min = element.default_min_value;
            thresholdData[key].max = element.default_max_value;

        });
    }
    if (checkStatus) {
        return thresholdData;
    } else {
        return null;
    }
}

function checkSensorRealTime(machine_id) {
    let checkSensorObj = {};
    let obj = {};
    try {
        const checkSensorList = utils.filterByMultipleKeysValues(mySqlLoad.machineInstalledSensorList, {
            'device_id': machine_id,
            "sensor_name": "ConductivityProbe,DrainSwitch,EnergyMeter"
        });
        checkSensorList.forEach(checkSensor => {
            obj[checkSensor.sensor_name] = checkSensor.status;
        });
        (obj.DrainSwitch == 1 && obj.ConductivityProbe == 1) ? checkSensorObj.sensor_water_change = true: checkSensorObj.sensor_water_change = false;

        (obj.EnergyMeter == 1) ? checkSensorObj.sensor_energy_consumption = true: checkSensorObj.sensor_energy_consumption = false;
        return checkSensorObj;
    } catch (e) {
        return null;
    }
}


function dataFormate(rObj) {
    let tempDate = null;
    let tempObj = {};
    let resonse = [];
    rObj.forEach((obj, i) => {
        if (date == tempDate) {
            tempObj[obj.kpi] = obj.value;
            if (rObj.length - 1 == i) {
                resonse.push(tempObj);
            }
        } else if (date != tempDate) {
            if (tempDate) {
                resonse.push(tempObj);
            }
            tempObj = {};
            tempDate = date;
            tempObj.date = date;
        }

    });
    return resonse;
}