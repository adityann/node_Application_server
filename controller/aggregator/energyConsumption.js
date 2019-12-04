const logger = require('../../startup/logger');
const util = require('../../util/utils');
const initData = require('../../startup/init');
const socketIO = require('../../util/socketIO');
const kpiKey = require('../../config/commonFlagVaraible').kpi.keys;



module.exports = {
    aggregatedEnergyConsumption: aggregatedEnergyConsumption
}

function aggregatedEnergyConsumption(plexusData, redisResponse, deviceType) {
    let machineId = plexusData.machineID;
    let current_time = Number(plexusData.time_stamp);
    try {
        if (deviceType == 'pro' && plexusData.sensorData.Electricity_meter) {
            const machineEnergySensorObj = util.filterByMultipleKeysValues(initData.machineInstalledSensorList, {
                'device_id': machineId,
                "sensor_name": "EnergyMeter"
            });
            logger.debug(`fn:aggregatedEnergyConsumption-${machineId}-${current_time} deviceType:-${deviceType}  machineEnergySensor:-${JSON.stringify(machineEnergySensorObj)}`);

            if (machineEnergySensorObj.length > 0) {
                //If energy meter installed and machine type is pro then do calculation.
                if (machineEnergySensorObj[0].status == 1) {
                    return calculateEnergyConsumption(plexusData, redisResponse);
                } else {
                    logger.debug(`fn:aggregatedEnergyConsumption-${machineId}-${current_time} ${JSON.stringify(machineEnergySensorObj)}`);
                    return null;
                }
            } else {
                logger.warn(`fn:aggregatedEnergyConsumption-${plexusData.machineID}-${current_time} ${JSON.stringify(machineEnergySensorObj)}`);
                return null;
            }

        } else {
            logger.debug(`fn:aggregatedEnergyConsumption-${machineId}-${current_time} deviceType:-${deviceType} electricityMeter:${plexusData.sensorData.Electricity_meter}`);

        }
    } catch (err) {
        logger.error(`fn:aggregatedEnergyConsumption-${plexusData.machineID}-${current_time}  error:-` + err);
        return null;
    }
}


/**
 * This function will calculate energy consumption for each plexus data using previous plexus data.
 * @param {*} machineId 
 * @param {*} plexusData 
 * @param {*} current_time 
 */
function calculateEnergyConsumption(plexusData, redisResponse) {
    try {
        let currentPulseCount = Number(plexusData.sensorData.Electricity_meter);
        let lastPulseCount = redisResponse.energyConsumption.energyMeter;
        let socketObject = {
            machineID: null,
        }

        logger.debug(`calculateEnergyConsumption:-${plexusData.machineID}-${plexusData.time_stamp} syncToken:${redisResponse.syncToken}/${plexusData.sync_token} currentPulse:${currentPulseCount} lastPulse:${lastPulseCount}`);
        if (lastPulseCount != null) {
            let lastSyncToken = redisResponse.syncToken;
            if (plexusData.sync_token == lastSyncToken) {
                if (Number(currentPulseCount) > Number(lastPulseCount)) {
                    redisResponse.energyConsumption.totalEnergy = redisResponse.energyConsumption.totalEnergy + (((currentPulseCount - lastPulseCount) * redisResponse.energyConsumption.pulse_rate) / 1000);
                    redisResponse.dbUpdate.accEnergyConsumption = 1;
                    //emitting data to Socket
                    socketObject.machineID = plexusData.machineID;
                    socketObject[kpiKey.energy_consumption] = redisResponse.energyConsumption.totalEnergy;
                    socketIO.sendLiveData(plexusData.machineID, socketObject);
                }
            } else if (plexusData.sync_token != lastSyncToken) {
                redisResponse.energyConsumption.totalEnergy = redisResponse.energyConsumption.totalEnergy + ((currentPulseCount * redisResponse.energyConsumption.pulse_rate) / 1000);
                redisResponse.dbUpdate.accEnergyConsumption = 1;
                //emitting data to Socket
                socketObject.machineID = plexusData.machineID;
                socketObject[kpiKey.energy_consumption] = redisResponse.energyConsumption.totalEnergy;
                socketIO.sendLiveData(plexusData.machineID, socketObject);
            }
        } else {
            const machineEnergyMeterObj = util.filterByKeyValue(initData.machineEnergyMeterList,
                'device_id',
                plexusData.machineID);
            redisResponse.energyConsumption.pulse_rate = machineEnergyMeterObj.pulse_rate;
            redisResponse.energyConsumption.totalEnergy = (currentPulseCount * machineEnergyMeterObj.pulse_rate) / 1000;
            redisResponse.dbUpdate.accEnergyConsumption = 1;
            //emitting data to Socket
            socketObject.machineID = plexusData.machineID;
            socketObject[kpiKey.energy_consumption] = redisResponse.energyConsumption.totalEnergy;
            socketIO.sendLiveData(plexusData.machineID, socketObject);
        }
        redisResponse.energyConsumption.energyMeter = currentPulseCount;

        logger.debug(`calculateEnergyConsumption:-${plexusData.machineID}-${plexusData.time_stamp} syncToken:${redisResponse.syncToken}/${plexusData.sync_token} totalenergy:${ redisResponse.energyConsumption.totalEnergy} currentPulse:${currentPulseCount} lastPulse:${lastPulseCount}`);
        //update cassandra with calculated energy consumption.

        return redisResponse;
    } catch (err) {

        logger.error(`calculateEnergyConsumption:-${plexusData.machineID}-${plexusData.time_stamp} error:${err}`);
        return;
    }
}