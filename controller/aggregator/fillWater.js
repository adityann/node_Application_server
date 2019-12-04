const logger = require('../../startup/logger');
const util = require('../../util/utils');
const initData = require('../../startup/init');
const socketIO = require('../../util/socketIO');
const kpiKey = require('../../config/commonFlagVaraible').kpi.keys;



module.exports = {
    fillWater: fillWater
}

/**
 * 
 * @param {*} plexusData 
 * @param {*} device_type 
 * @param {*} redisResponse 
 */

function fillWater(plexusData, device_type, redisResponse) {
    let sensorParams = {};
    sensorParams.device_id = plexusData.machineID;

    sensorParams.sensor_name = 'FillWaterMeter';
    let fillwaterStatus = util.filterByMultipleKeysValues(initData.machineInstalledSensorList, sensorParams);
    sensorParams.sensor_name = 'ConductivityProbe';

    let machineConductivityPro = util.filterByMultipleKeysValues(initData.machineInstalledSensorList, sensorParams);
    sensorParams.sensor_name = 'DrainSwitch';

    // Drain-Switch
    let machineDrainSwitch = util.filterByMultipleKeysValues(initData.machineInstalledSensorList, sensorParams);

    try {

        logger.debug(`fn:fillWater-${plexusData.machineID}-${plexusData.time_stamp}   WaterMeter:${fillwaterStatus[0].status} device_type(Pro/Basic):-${device_type} Drain-Switch:${machineDrainSwitch[0].status} conductivityProbe:${machineConductivityPro[0].status}`);
        // calculate fill Water --Water Meter
        let [fillWaterMeasured, fillWaterCalculation] = [null, null];
        if (fillwaterStatus[0].status == 1 && device_type == 'pro') {
            fillWaterMeasured = calculateFillWaterMeasured(plexusData, redisResponse);
        }
        // calculate fill Water --Drain
        if (machineDrainSwitch[0].status == 1) {
            fillWaterCalculation = fillWaterCalDrainSwitch(plexusData, redisResponse, fillwaterStatus[0].status);
        } else if (machineConductivityPro[0].status == 1) { // calculate fill Water --Probe
            fillWaterCalculation = fillWaterConductivityPro(plexusData, redisResponse, fillwaterStatus[0].status);
        }

        return [fillWaterMeasured, fillWaterCalculation];
    } catch (err) {
        logger.error(`fillWater-${plexusData.machineID}-${plexusData.time_stamp}   WaterMeter:${fillwaterStatus[0]} device_type(Pro/Basic):-${device_type} Drain-Switch:${machineDrainSwitch[0]} conductivityProbe:${machineConductivityPro[0]}`);
        logger.error(`fillwater-${plexusData.machineID}-${plexusData.time_stamp} Catch: ${JSON.stringify(err)}`);
    }
}

/**
 * 
 * @param {*} plexusData 
 * @param {Redis Object} redisResponse 
 */

function calculateFillWaterMeasured(plexusData, redisResponse) {
    try {

        let currentWaterMeterPulseCount = Number(plexusData.sensorData.Fill_water);
        if (currentWaterMeterPulseCount) {
            logger.debug(`fn:calculateFillWaterMeasured-${plexusData.machineID}-${plexusData.time_stamp}  redisResponse:${JSON.stringify(redisResponse.fillWater)}`);

            if (redisResponse.fillWater.totalFillWater > 0) {
                if (plexusData.sync_token == redisResponse.fillWater.syncToken && (currentWaterMeterPulseCount > redisResponse.fillWater.waterMeterPulseCount)) {
                    redisResponse.fillWater.totalFillWater = redisResponse.fillWater.totalFillWater + ((currentWaterMeterPulseCount - redisResponse.fillWater.waterMeterPulseCount) * redisResponse.fillWater.literPerPulse);
                    redisResponse.dbUpdate.accFillWater = 1;
                } else if (plexusData.sync_token != redisResponse.fillWater.syncToken) {
                    redisResponse.fillWater.totalFillWater = redisResponse.fillWater.totalFillWater + (currentWaterMeterPulseCount * redisResponse.fillWater.literPerPulse);
                    redisResponse.dbUpdate.accFillWater = 1;
                }
            } else {
                // Cheeck fill water sensor 
                const waterFillInfo = util.filterByMultipleKeysValues(initData.machineWaterInfoList, {
                    'device_id': plexusData.machineID,
                    "meter_type": 'fill'
                });
                redisResponse.fillWater.literPerPulse = waterFillInfo[0].liter_per_pulse;
                redisResponse.fillWater.totalFillWater = currentWaterMeterPulseCount * waterFillInfo[0].liter_per_pulse;
                redisResponse.dbUpdate.accFillWater = 1;
            }
            redisResponse.fillWater.syncToken = plexusData.sync_token;
            redisResponse.fillWater.waterMeterPulseCount = currentWaterMeterPulseCount;

            if (redisResponse.dbUpdate.accFillWater == 1) {
                //emitting data to Socket
                socketIO.sendLiveData(plexusData.machineID, {
                    machineID: plexusData.machineID,
                    [kpiKey.fill_water]: redisResponse.fillWater.totalFillWater
                });
            }

            logger.debug(`fn:calculateFillWaterMeasured-${plexusData.machineID}-${plexusData.time_stamp} syncToken:${redisResponse.syncToken}/${plexusData.sync_token} WaterMeterPulse-${redisResponse.fillWater.waterMeterPulseCount}/${currentWaterMeterPulseCount}`);

            return redisResponse;
        } else {
            logger.warn(`fn:calculateFillWaterMeasured-${plexusData.machineID}-${plexusData.time_stamp} message:'Fill_water sensor is missing'`)
        }
    } catch (err) {
        logger.error(`exception identified in fill water measured: ${err}`);
    }
}
/**
 * 
 * @param {*} plexusData 
 * @param {*} redisResponse 
 * @param {Fill Water Meter }  fillMeterFlag 
 */
function fillWaterConductivityPro(plexusData, redisResponse, fillMeterFlag) {
    try {
        logger.debug(`fn:fillWaterConductivityPro-${plexusData.machineID}-${plexusData.time_stamp} currentConductivity:-${plexusData.sensorData.Conductivity_Beta_Units} redisResponse:${JSON.stringify(redisResponse.fillWater)}`);

        let currentConductivity = Number(plexusData.sensorData.Conductivity_Beta_Units);
        let oldConductivity = redisResponse.fillWater.conductivity;

        if (plexusData.sensorData.Conductivity_Beta_Units > 0 && oldConductivity != null) {
            if (currentConductivity >= 10 && currentConductivity <= 100) {
                if (currentConductivity == oldConductivity) {
                    logger.debug("fn:fillWaterConductivityProTimeDIff-" + redisResponse.fillWater.timeDiff);
                    if (redisResponse.fillWater.timeDiff <= 5) {
                        redisResponse.fillWater.timeDiff = redisResponse.fillWater.timeDiff +
                            plexusData.time_stamp - redisResponse.fillWater.timeStamp;
                        redisResponse.fillWater.timeStamp = plexusData.time_stamp;
                        redisResponse.fillWater.conductivity = currentConductivity;
                    }
                    if (redisResponse.fillWater.timeDiff >= 5 && redisResponse.fillWater.isAllreadyFilled == 0) {
                        //fill cycle by 1
                        redisResponse.dbUpdate.accFillCount = 1;
                        redisResponse.fillWater.waterFillCount = redisResponse.fillWater.waterFillCount + 1;
                        redisResponse.fillWater.isAllreadyFilled = 1;
                        logger.debug("fn:fillWaterConductivityProTime FIll Count-" + redisResponse.fillWater.waterFillCount);
                        let socketObject = {
                            machineID: plexusData.machineID,
                            [kpiKey.fill_cycle]: redisResponse.fillWater.waterFillCount
                        }

                        // Calculated Fill Water = Fill Water Volume * Number of Fills in the day
                        if (fillMeterFlag == 0) {
                            redisResponse.fillWater.totalFillWater =
                                redisResponse.fillWater.tankVolume * redisResponse.fillWater.waterFillCount;
                            redisResponse.dbUpdate.accFillWater = 1;
                            socketObject[kpiKey.fill_water] = redisResponse.fillWater.totalFillWater

                        }

                        //emitting data to Socket
                        socketIO.sendLiveData(plexusData.machineID, socketObject);
                    }
                } else if (currentConductivity !== oldConductivity) {
                    redisResponse.fillWater.conductivity = currentConductivity;
                    redisResponse.fillWater.timeStamp = plexusData.time_stamp;
                    redisResponse.fillWater.timeDiff = 0;

                }
            }
        } else if (plexusData.sensorData.Conductivity_Beta_Units == 0) {
            let machineTankVolume = util.filterByKeyValue(initData.machineTankVolumeList, 'machine_system_id', plexusData.machineID);
            if (machineTankVolume) {
                redisResponse.fillWater.tankVolume = machineTankVolume.tank_volume;
            }
            redisResponse.fillWater.conductivity = currentConductivity;
            redisResponse.fillWater.timeStamp = Number(plexusData.time_stamp);
            redisResponse.fillWater.timeDiff = 0;
            redisResponse.fillWater.isAllreadyFilled = 0;
        }

        logger.debug(`fn:fillWaterConductivityPro-${plexusData.machineID}-${plexusData.time_stamp} oldConductivity:${oldConductivity} currentConductivity-${currentConductivity} timeDiff:${redisResponse.fillWater.timeDiff} `)

        return redisResponse;
    } catch (err) {
        logger.error(`fn:fillWaterConductivityPro-${plexusData.machineID} message:'error in tryCatch' machineId:${plexusData.machineID} description:${String(err)}`);
        return err;
    }
}
/**
 * 
 * @param {*} plexusData 
 * @param {*} redisResponse 
 * @param {Fill Water Meter } fillMeterFlag 
 */
function fillWaterCalDrainSwitch(plexusData, redisResponse, fillMeterFlag) {
    try {
        let currentDrainTrigger = plexusData.triggers.drain;
        let oldDrainTrigger = redisResponse.fillWater.drainTrigger;

        logger.debug(`fn:fillWaterCalDrainSwitch-${plexusData.machineID}-${plexusData.time_stamp} currentDrainTrigger:-${currentDrainTrigger} oldDrainTrigger:${oldDrainTrigger} resDrainCatch:${JSON.stringify(redisResponse.fillWater)}`);

        if (oldDrainTrigger) {
            if (currentDrainTrigger === oldDrainTrigger) {
                if (redisResponse.fillWater.timeDiff <= 300 && redisResponse.fillWater.isAllreadyFilled == 0) {
                    redisResponse.fillWater.timeDiff = redisResponse.timeDiff + (Number(plexusData.time_stamp) - redisResponse.fillWater.timeStamp);
                    redisResponse.fillWater.timeStamp = Number(plexusData.time_stamp);
                    redisResponse.fillWater.drainTrigger = currentDrainTrigger;

                }
                if (redisResponse.timeDiff >= 300 && redisResponse.fillWater.isAllreadyFilled == 0) {
                    //fill cycle by 1
                    redisResponse.fillWater.waterFillCount =
                        redisResponse.fillWater.waterFillCount + 1;
                    redisResponse.fillWater.isAllreadyFilled = 1;
                    redisResponse.dbUpdate.accFillCount = 1;


                    let socketObject = {
                        machineID: plexusData.machineID,
                        [kpiKey.fill_cycle]: redisResponse.fillWater.waterFillCount
                    }
                    // Calculated Fill Water = Fill Water Volume * Number of Fills in the day
                    if (fillMeterFlag == 0) {
                        redisResponse.dbUpdate.accFillWater = 1;
                        redisResponse.fillWater.totalFillWater = redisResponse.fillWater.tankVolume * redisResponse.fillWater.waterFillCount;
                        socketObject[kpiKey.fill_water] = redisResponse.fillWater.totalFillWater
                    }

                    //emitting data to Socket
                    socketIO.sendLiveData(plexusData.machineID, socketObject);
                }
            } else if (currentDrainTrigger != oldDrainTrigger) {
                redisResponse.fillWater.drainTrigger = currentDrainTrigger;
                redisResponse.fillWater.timeStamp = Number(plexusData.time_stamp);
                redisResponse.fillWater.timeDiff = 0;
            }
        } else if (currentDrainTrigger == 1) {
            redisResponse.fillWater.drainTrigger = currentDrainTrigger;
            redisResponse.fillWater.timeStamp = Number(plexusData.time_stamp);
            redisResponse.fillWater.timeDiff = 0;
            let machineTankVolume = util.filterByKeyValue(initData.machineTankVolumeList, 'machine_system_id', plexusData.machineID);
            if (machineTankVolume) {
                redisResponse.fillWater.tankVolume = machineTankVolume.tank_volume;
            }
        } else if (currentDrainTrigger == 0) {
            redisResponse.fillWater.drainTrigger = currentDrainTrigger;
            redisResponse.fillWater.isAllreadyFilled = 0;
        }

        return redisResponse;
    } catch (err) {
        logger.error(`fn:fillWaterCalDrainSwitch-${plexusData.machineID} message:'error in tryCatch' machineId:${plexusData.machineID} description:${String(err)}`);
    }
}