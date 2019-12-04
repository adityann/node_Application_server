const logger = require('../../startup/logger');
const myUtils = require('../../util/utils');
const initData = require('../../startup/init');
var socketIO = require('../../util/socketIO');

module.exports = {
    alarmThreshold: alarmThreshold
}



function minMaxValue(thresholdByMachineId) {
    let temp = {
        min: 0,
        max: 0
    }
    if (thresholdByMachineId.length > 0) {
        let checkAdjValue = thresholdByMachineId[0].adjusted_value_used === 1;
        temp.max = (checkAdjValue) ? thresholdByMachineId[0].adjusted_max_value : thresholdByMachineId[0].default_max_value;
        temp.min = (checkAdjValue) ? thresholdByMachineId[0].adjusted_min_value : thresholdByMachineId[0].default_min_value;
    }
    return temp;

}

function preWashTemperature(redisObject, plexusData, deviceType, thresholdByMachineId) {
    try {
        let temperatureStatus = {
            temperature: plexusData.sensorData.Pre_Wash_Temperature,
            temp: minMaxValue(thresholdByMachineId)
        }
        let status = '-';
        if (deviceType === 'pro') {

            status = getTemperatureStatus(temperatureStatus);
            if (plexusData.triggers.wash === 1) {
                if (redisObject.washTemp === undefined || !redisObject.washTemp) {
                    redisObject.washTemp = true;
                }
                logger.debug("fn:preWashTemperature Wash Flag - ON -" + redisObject.washTemp)
            } else if (plexusData.triggers.wash === 0) {
                if (redisObject.washTemp) {
                    redisObject.washTemp = false;
                }
            }
        }
        return status;

    } catch (e) {
        logger.error(`fn: preWashMethod Error message: description:${JSON.stringify(e)}`)

    }
}


function washTemperature(plexusData, thresholdByMachineId, installedSensor) {
    try {
        var status = '0';
        if (installedSensor.length > 0) {
            if (installedSensor[0].status === 1) {
                var temp = minMaxValue(thresholdByMachineId);

                let temperatureStatus = {};
                temperatureStatus.temperature = plexusData.sensorData.Wash_Temperature;
                temperatureStatus.temp = temp;

                if (plexusData.sensorData.Wash_Temperature < 0) {
                    return status;
                } else {
                    status = getTemperatureStatus(temperatureStatus);
                    return status;
                }
            } else {
                status = '-';
                return status;
            }
        }
    } catch (e) {
        logger.error(`fn: washTemperature Error message: description:${JSON.stringify(e)}`)

    }
}





function rinseTemperature(plexusData, thresholdByMachineId, installedSensor) {
    try {
        var status = '0';
        if (installedSensor.length > 0) {

            if (installedSensor[0].status === 1) {
                let temperatureStatus = {
                    temperature: plexusData.sensorData.Rinse_Temperature,
                    temp: minMaxValue(thresholdByMachineId)
                }

                if (plexusData.sensorData.Rinse_Temperature < 0) {
                    return status;
                } else {
                    status = getTemperatureStatus(temperatureStatus);
                    return status;
                }
            } else {
                status = 'description-';
                return status;
            }
        }
    } catch (e) {
        logger.error(`fn: rinseTemperature  errorDescription:${JSON.stringify(e)}`)


    }
}

function detergentConcentration(plexusData, thresholdByMachineId) {
    try {
        var flag = '0';
        if (plexusData.triggers.wash === 1) {
            var temp = minMaxValue(thresholdByMachineId)
            if (plexusData.sensorData.C3M_Conductivity_Beta_Units < temp.min) {
                flag = '1';
            } else if (plexusData.sensorData.C3M_Conductivity_Beta_Units >= temp.min &&
                plexusData.sensorData.C3M_Conductivity_Beta_Units <= temp.max) {
                flag = '2';
            } else if (plexusData.sensorData.C3M_Conductivity_Beta_Units > temp.max) {
                flag = '0';
            }
            return flag;
        } else {
            return flag;
        }
    } catch (e) {
        logger.error(`fn: detergentConcentration Error message: description:${JSON.stringify(e)}`);
    }
}


/**
 * calculate Average rinse water flow rate
 * @param {*} redisObject (rinseWater >900 Second)
 * @param {*} avgRinseWaterflowThreshhold 
 */

function avgRinseFlowRateCalculation(redisObject, avgRinseWaterflowThreshhold) {
    let avgRinseFlowRate = 0,
        status = '0';
    if (redisObject.rinseTime && ((redisObject.rinseTime / 3600) >= 0.25) &&
        redisObject.rinseCalculation.totalRinseWater > 0) {
        let thresholdValue = minMaxValue(avgRinseWaterflowThreshhold);
        avgRinseFlowRate = redisObject.rinseCalculation.totalRinseWater / (redisObject.rinseTime / 3600);
        if (avgRinseFlowRate > thresholdValue.max) {
            status = "TOO HIGH";
        } else if (avgRinseFlowRate >= thresholdValue.min && avgRinseFlowRate <= thresholdValue.max) {
            status = "NORMAL";
        } else if (avgRinseFlowRate < thresholdValue.min && avgRinseFlowRate >= 0) {
            status = "TOO LOW";
        }
        redisObject.rinseCalculation.avgRinseWaterflowRate = avgRinseFlowRate;
        redisObject.rinseCalculation.avgRinseFlowRateStatus = status;
        redisObject.dbUpdate.avgRinseWaterFlowRate = 1;
    }
    return {
        avgRinseFlowRate: avgRinseFlowRate,
        status: status
    }

}





function alarmThreshold(plexusData, machineType, redisObject) {
    // filtering the respective threshold according to the KPI
    const sensorParams = {};
    sensorParams.machine_system_id = plexusData.machineID;
    sensorParams.alarm_type = 'Pre Wash Temperature';

    const preWashThreshhold = myUtils.filterByMultipleKeysValues(initData.alarmthreshholdTempList,
        sensorParams);

    sensorParams.alarm_type = 'Wash Temperature';
    const WashTempThreshhold = myUtils.filterByMultipleKeysValues(initData.alarmthreshholdTempList,
        sensorParams);

    sensorParams.alarm_type = 'Rinse Temperature';
    const rinseTempThreshhold = myUtils.filterByMultipleKeysValues(initData.alarmthreshholdTempList,
        sensorParams);

    sensorParams.alarm_type = 'Detergent Concentration';
    const detergentConcThreshhold = myUtils.filterByMultipleKeysValues(initData.alarmthreshholdTempList,
        sensorParams);

    sensorParams.sensor_name = 'WashTemperatureProbe';
    const WashTempSensor = myUtils.filterByMultipleKeysValues(initData.machineInstalledSensorList,
        sensorParams);

    sensorParams.sensor_name = 'RinseTemperatureProbe';
    const RinseTempSensor = myUtils.filterByMultipleKeysValues(initData.machineInstalledSensorList,
        sensorParams);

    sensorParams.alarm_type = 'Avg. Rinse Water Flow Rate';
    const avgRinseWaterflowThreshhold = myUtils.filterByMultipleKeysValues(initData.alarmthreshholdTempList,
        sensorParams);


    let liveData = {
        machineID: plexusData.machineID,
        Pre_Wash_Temperature: plexusData.sensorData.Pre_Wash_Temperature,
        Wash_Temperature: plexusData.sensorData.Wash_Temperature,
        Rinse_Temperature: plexusData.sensorData.Rinse_Temperature,
        detergent_concentration: plexusData.sensorData.C3M_Conductivity_Beta_Units,
        epocTime: plexusData.time_stamp,
        trigger: plexusData.triggers
    }

    if (preWashThreshhold && WashTempThreshhold && rinseTempThreshhold && detergentConcThreshhold) {
        let result = {};

        let pre_wash_status = preWashTemperature(redisObject, plexusData, machineType, preWashThreshhold);
        result["preWashStatus"] = pre_wash_status || null;
        liveData["pre_wash_status"] = pre_wash_status;

        if (plexusData.sensorData.C3M_Conductivity_Beta_Units) {
            let detergent_conc_flag = detergentConcentration(plexusData, detergentConcThreshhold);
            liveData["detergent_concentration_status"] = detergent_conc_flag
            result["detergentConcentrationStatus"] = detergent_conc_flag


        }
        if (WashTempSensor && RinseTempSensor) {
            let rinse_temperature_status = rinseTemperature(plexusData, rinseTempThreshhold, RinseTempSensor);
            let wash_temperature_status = washTemperature(plexusData, WashTempThreshhold, WashTempSensor);
            liveData["rinse_temperature_status"] = rinse_temperature_status;
            liveData["wash_temperature_status"] = wash_temperature_status
            result["rinseTemperatureStatus"] = rinse_temperature_status
            result["washTemperatureStatus"] = wash_temperature_status
        }

        if (avgRinseWaterflowThreshhold) {
            let avgRinseFlowRateObject = avgRinseFlowRateCalculation(redisObject, avgRinseWaterflowThreshhold);
            liveData["avgRinseFlowRate"] = avgRinseFlowRateObject.avgRinseFlowRate;
            liveData["avgRinseFlowRateStatus"] = avgRinseFlowRateObject.status;
            result["avgRinseFlowRate"] = avgRinseFlowRateObject.avgRinseFlowRate;
            result["avgRinseFlowRateStatus"] = avgRinseFlowRateObject.status;
        }
        redisObject.alarmThreshold = result;
    }
    socketIO.sendLiveData(plexusData.machineID, liveData);

    return liveData;
}

function getTemperatureStatus(temperatureObj) {
    let status = '0';
    if (temperatureObj.temperature <= temperatureObj.temp.max &&
        temperatureObj.temperature >= temperatureObj.temp.min) {
        status = "NORMAL";
    } else if (temperatureObj.temperature < temperatureObj.temp.min) {
        status = "TOO LOW";
    } else if (temperatureObj.temperature > temperatureObj.temp.max) {
        status = "TOO HIGH";
    }
    return status;
}