const utilFunction = require("../../util/utils");
const logger = require('../../startup/logger');
const machine = require('../../config/commonFlagVaraible');
const initData = require('../../startup/init');
const parameterHygiene = require('../aggregator/parameterHygiene');
const rinseWater = require('../aggregator/rinseWater');
const kpiKey = require('../../config/commonFlagVaraible').kpi.keys;
const socketIO = require('../../util/socketIO');

module.exports = {
    processTriggers: processTriggers
}

/**
 * 
 * @param {*} resPlexusData
 * @param {*} redisResponse
 * @param {*} currentDate
 * 
 */
function processTriggers(resPlexusData, redisResponse, getMachine) {
    try {
        if (getMachine.device_type == 'basic' && redisResponse.rinseCalculation.nominalRinseFlowRate == null) {
            let machineRinseInfo = utilFunction.filterByKeyValue(initData.nominalRinseFlowRate, 'machine_system_id', resPlexusData.machineID);
            logger.debug("qwerty" + machineRinseInfo[0]);
            logger.debug(`fn:processTriggers():machineRinseInfo :${JSON.stringify(machineRinseInfo)} "`);
            redisResponse.rinseCalculation.nominalRinseFlowRate = machineRinseInfo.nominal_machine_rinse_flow_rate;
        }


        let socketObject = {
            machineID: resPlexusData.machineID
        }

        if (machine.machineType.conveyorMachineType.includes(getMachine.machine_type)) {
            let rackCount = utilFunction.filterByKeyValue(initData.rackCountList, 'machine_id', resPlexusData.machineID);
            let rackCountNum = rackCount.rack_time;
            if (resPlexusData.triggers.wash == 1) {
                if (redisResponse.wash == null) {
                    logger.debug("processTriggers(): redisResponse.wash::" + redisResponse.wash);
                    redisResponse.wash = resPlexusData.time_stamp;
                } else {

                    redisResponse.washTime = redisResponse.washTime + resPlexusData.time_stamp - redisResponse.wash;
                    redisResponse.wash = resPlexusData.time_stamp;
                    redisResponse.dbUpdate.accWashTime = 1;
                    socketObject[kpiKey.wash_time] = redisResponse.washTime;
                }
                //Record Parameter Hygiene data for Conveyor in Redis. (Capture all parameter data)
                parameterHygiene.insertOrUpdateParameterHygieneInRedis(resPlexusData, redisResponse, true, false)
                if (resPlexusData.triggers.rinse == 1) {

                    if (redisResponse.rinse == null) {
                        redisResponse.rinse = resPlexusData.time_stamp;
                    } else {
                        redisResponse.rinseTime = redisResponse.rinseTime + resPlexusData.time_stamp -
                            redisResponse.rinse;
                        redisResponse.rinse = resPlexusData.time_stamp;
                        redisResponse.dbUpdate.accRinsetime = 1;
                        socketObject[kpiKey.rinse_time] = redisResponse.rinseTime;
                    }
                }
                if (resPlexusData.triggers.rinse == 0) {
                    if (redisResponse.rinse != null) {
                        redisResponse.rinseTime = redisResponse.rinseTime +
                            resPlexusData.time_stamp - redisResponse.rinse;
                        redisResponse.rinse = null;
                        redisResponse.dbUpdate.accRinsetime = 1;
                        socketObject[kpiKey.rinse_time] = redisResponse.rinseTime;

                    }
                    if (getMachine.device_type == 'basic') {
                        redisResponse.rinseCalculation.totalRinseWater =
                            ((redisResponse.rinseCalculation.nominalRinseFlowRate) * (redisResponse.rinseTime / 3600));
                        redisResponse.dbUpdate.accRinseWater = 1;
                        socketObject[kpiKey.rinse_water] = redisResponse.totalRinseWater;

                    }
                    //Calcultae Avg rinse water flow rate
                }
            }
            if (resPlexusData.triggers.wash == 0) {
                if (resPlexusData.triggers.rinse == 0) {
                    if (redisResponse.rinse != null) {
                        redisResponse.rinseTime = redisResponse.rinseTime +
                            resPlexusData.time_stamp - redisResponse.rinse;
                        redisResponse.dbUpdate.accRinsetime = 1;
                        socketObject[kpiKey.rinse_time] = redisResponse.rinseTime;

                        redisResponse.rinse = null;
                        if (getMachine.device_type == 'basic') {
                            redisResponse.rinseCalculation.totalRinseWater =
                                ((redisResponse.rinseCalculation.nominalRinseFlowRate) * (redisResponse.rinseTime / 3600));
                            redisResponse.dbUpdate.accRinseWater = 1;

                            socketObject[kpiKey.rinse_water] = redisResponse.totalRinseWater;

                        }
                        //Calcultae Avg rinse water flow rate
                    }
                    if (redisResponse.wash != null) {
                        redisResponse.washTime = redisResponse.washTime +
                            resPlexusData.time_stamp - redisResponse.wash;
                        redisResponse.dbUpdate.accWashTime = 1;
                        socketObject[kpiKey.wash_time] = redisResponse.washTime;

                        redisResponse.wash = null;
                    }
                }
            }
            if (redisResponse.rinseTime > 900 && redisResponse.rinseTime < redisResponse.washTime) {
                redisResponse.usageEfficiency = (redisResponse.rinseTime / redisResponse.washTime) * 100;
                redisResponse.dbUpdate.accUsageEffiency = 1;
                socketObject[kpiKey.machine_efficiency] = redisResponse.usageEfficiency;
            }


            if (redisResponse.rinseTime > rackCountNum) {
                if (redisResponse.washCycle < Math.trunc(redisResponse.rinseTime / rackCountNum)) {
                    redisResponse.washCycle = Math.trunc(redisResponse.rinseTime / rackCountNum);
                    redisResponse.dbUpdate.accWashCycles = 1;
                    socketObject[kpiKey.wash_cycle] = redisResponse.washCycle;
                    parameterHygiene.insertOrUpdateParameterHygieneInDB(redisResponse);
                    let isWashCycleInteger = redisResponse.rinseTime / rackCountNum;
                    logger.debug("PparameterHygiene" + (Number.isInteger(isWashCycleInteger)));
                    if (!Number.isInteger(isWashCycleInteger)) {
                        parameterHygiene.insertOrUpdateParameterHygieneInRedis(resPlexusData, redisResponse, true, false);
                    }
                    logger.debug("PparameterHygiene after call" + redisResponse.washCycle);
                }
            }

            socketIO.sendLiveData(resPlexusData.machineID, socketObject);
            if (getMachine.device_type == 'pro') {
                rinseWater.getRinseWaterMeasured(resPlexusData, redisResponse, getMachine);
            }

        } else if (machine.machineType.doorMachineType.includes(getMachine.machine_type)) {
            logger.debug(`fn:processTriggers(): dooor processing started "` + getMachine.device_type);
            logger.debug("redisResponse.rinse door" + redisResponse.rinseTime);
            if (redisResponse.fillInstalledSensor == null) {
                var fill = utilFunction.filterByMultipleKeysValues(initData.machineInstalledSensorList, {
                    'device_id': resPlexusData.machineID,
                    "sensor_name": "FillTrigger"
                })
                redisResponse.fillInstalledSensor = fill[0].status;
            }


            if (resPlexusData.triggers.wash == 1) {
                parameterHygiene.insertOrUpdateParameterHygieneInRedis(resPlexusData, redisResponse, false, false);
                if (redisResponse.wash == null) {
                    redisResponse.wash = resPlexusData.time_stamp;
                    redisResponse.isWashFlagWasOn = true;
                } else {
                    redisResponse.washTime = redisResponse.washTime +
                        resPlexusData.time_stamp - redisResponse.wash;
                    redisResponse.isWashFlagWasOn = true;
                    redisResponse.wash = resPlexusData.time_stamp;

                    socketObject[kpiKey.wash_time] = redisResponse.washTime;

                    redisResponse.dbUpdate.accWashTime = 1;
                    logger.debug('fn: redisResponse.washTime:: Door' + redisResponse.washTime);
                    
                }
            } else if (resPlexusData.triggers.wash == 0) {
                if (redisResponse.wash != null) {
                    redisResponse.washTime = redisResponse.washTime +
                        resPlexusData.time_stamp - redisResponse.wash;
                    redisResponse.dbUpdate.accWashTime = 1;
                    socketObject[kpiKey.wash_time] = redisResponse.washTime;

                    redisResponse.wash = null;
                }
            }

            if (resPlexusData.triggers.rinse == 1 &&
                (getMachine.device_type == 'basic' || (getMachine
                    .device_type == 'pro' && redisResponse.fillInstalledSensor == 0))) {
                //Check if previously wash happens or not
                parameterHygiene.insertOrUpdateParameterHygieneInRedis(resPlexusData, redisResponse, false, true)
 
                if (redisResponse.isWashFlagWasOn == true) {
                    if (redisResponse.rinse == null) {
                        redisResponse.rinse = resPlexusData.time_stamp;
                    } else {
                        redisResponse.rinseTime = redisResponse.rinseTime +
                            resPlexusData.time_stamp - redisResponse.rinse;
                        redisResponse.dbUpdate.accRinsetime = 1;
                        socketObject[kpiKey.rinse_time] = redisResponse.rinseTime;

                        redisResponse.rinse = resPlexusData.time_stamp;
                        logger.debug('fn: ProcessTrigger:: Door sResponse.rinseTime' +
                            redisResponse.rinseTime);

                    }
                }
            } else if (resPlexusData.triggers.rinse == 0 && (getMachine.device_type == 'basic' || (getMachine
                    .device_type == 'pro' && redisResponse.fillInstalledSensor == 0))) {
                parameterHygiene.insertOrUpdateParameterHygieneInRedis(resPlexusData, redisResponse, false, true);
                if (redisResponse.isWashFlagWasOn == true && redisResponse.rinse != null) {
                    redisResponse.rinseTime = redisResponse.rinseTime +
                        resPlexusData.time_stamp - redisResponse.rinse;
                    redisResponse.washCycle = redisResponse.washCycle + 1;
                    redisResponse.dbUpdate.accWashCycles = 1;
                    socketObject[kpiKey.wash_cycle] = redisResponse.washCycle;

                    parameterHygiene.insertOrUpdateParameterHygieneInDB(redisResponse);
                    redisResponse.rinse = null;
                    redisResponse.isWashFlagWasOn = false;
                    redisResponse.rinseCalculation.totalRinseWater = (redisResponse.rinseCalculation.nominalRinseFlowRate) *
                        (redisResponse.rinseTime / 3600);
                    redisResponse.dbUpdate.accRinseWater = 1;
                    socketObject[kpiKey.rinse_water] = redisResponse.totalRinseWater;

                }
            }
            if (resPlexusData.triggers.rinse == 1 &&
                getMachine.device_type == 'pro' && redisResponse.fillInstalledSensor == 1) {
                //Check if previously wash happens or not
                if (redisResponse.isWashFlagWasOn == true) {
                    if (redisResponse.rinse == null) {
                        redisResponse.rinse = resPlexusData.time_stamp;
                        logger.debug("redisResponse.rinse" + redisResponse.rinse);
                        logger.debug("redisResponse.rinseTime rinse == null" + redisResponse.rinseTime);
                    } else {
                        redisResponse.rinseTime = redisResponse.rinseTime +
                            resPlexusData.time_stamp - redisResponse.rinse;
                        logger.debug("redisResponse.rinseTime rinse == 1:" + redisResponse.rinseTime);
                        redisResponse.dbUpdate.accRinsetime = 1;
                        socketObject[kpiKey.rinse_time] = redisResponse.rinseTime;

                    }

                }
            } else if (resPlexusData.triggers.rinse == 0 && getMachine.device_type == 'pro' &&
                redisResponse.fillInstalledSensor == 1) {
                if (redisResponse.isWashFlagWasOn == true) {
                    redisResponse.rinseTime = redisResponse.rinseTime +
                        resPlexusData.time_stamp - redisResponse.rinse;
                    logger.debug("redisResponse.rinseTime rinse == 0::" + redisResponse.rinseTime);
                    redisResponse.dbUpdate.accRinsetime = 1;
                    socketObject[kpiKey.rinse_time] = redisResponse.rinseTime;

                    redisResponse.isWashFlagWasOn = false;
                    if (redisResponse.rinseTime != null && redisResponse.rinseTime != 0) {
                        redisResponse.washCycle = redisResponse.washCycle + 1;
                        redisResponse.dbUpdate.accWashCycles = 1;
                        socketObject[kpiKey.wash_cycle] = redisResponse.washCycle;

                        parameterHygiene.insertOrUpdateParameterHygieneInDB(redisResponse);

                    }
                    redisResponse.rinse = null;
                }
            }
        }
        if (getMachine.device_type == 'pro') {
            rinseWater.getRinseWaterMeasured(resPlexusData, redisResponse, getMachine);
        }
        socketIO.sendLiveData(resPlexusData.machineID, socketObject);


        logger.debug("fn:processTriggers redisResponse" + JSON.stringify(redisResponse));

    } catch (error) {
        logger.error(`fn:processTriggers  error:"${JSON.stringify(error)}"`);
    }
}