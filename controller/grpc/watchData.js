'use strict';

const key = require('../../model/keysModel');
const parametersRealtime = require('../../model/parametersRealtime')
const grpcClient = require('../../startup/grpc/grpc_client');
const watchPlexusData = grpcClient.watchPlexusData({});
const watchSnapShotData = grpcClient.watchSnapShotData({});



const redisConn = require("../../util/redis/redisConnection");
const redisObjectModel = require('../../model/redisObjectModel');


const myUtils = require('../../util/utils');
const logger = require('../../startup/logger');
const initData = require('../../startup/init');

const cassandraClient = require("../../util/db/cassandra/cassandra_client");

const rinseAidConc = require('../aggregator/rinseAidConc');
const energyConsumption = require('../aggregator/energyConsumption');
const fillWaterCal = require('../aggregator/fillWater');
const dispenser = require('../aggregator/dispenserDetails');
const alarmthreshold = require('../aggregator/alarmThreshold')
const liveAggregation = require('../aggregator/liveAggregation');
const alertController = require('../alert/setOrClearAlert');


watchSnapShotData.on('data', (snapShotResponse) => {
    logger.debug(`watchSnapShotData-${snapShotResponse.machineID}-${snapShotResponse.time_stamp} snapShotResponse:${JSON.stringify(snapShotResponse)}`)
    rinseAidConc.rinseAidConcentraion(snapShotResponse.machineID, snapShotResponse.feeder_status_ss, snapShotResponse.time_stamp)
    /**
     * dispenser light Status called
     */
    dispenser.dispenserLightStatus(snapShotResponse);

})
/**
 * 
 */
watchPlexusData.on('data', function (resPlexusData) {
    let triggers = null;
    let washCycleChangeFlag = false;

    //try {
    logger.debug(`method:"plexusData"-:${resPlexusData.machineID}-${resPlexusData.time_stamp} resPlexusData:${JSON.stringify(resPlexusData)}`);
    if (resPlexusData.triggers) {

        logger.debug("resPlexusData.time_stamp::" + resPlexusData.time_stamp);
        resPlexusData.time_stamp = Number(resPlexusData.time_stamp);
        logger.debug("converted resPlexusData.time_stamp::" + resPlexusData.time_stamp);
        // Get  Current Date by using machineId and epocTime
        let currentDate = myUtils.epoch_date(resPlexusData.time_stamp, resPlexusData.machineID);

        if (currentDate) {

            let redisKey = new key(currentDate, resPlexusData.machineID).key;
            logger.info(`-----------------Start "${redisKey}-${resPlexusData.time_stamp}" ---------------`);

            //  check redis Object by 'redisKey'
            new Promise((resolve, reject) => {
                redisConn.getValueByKey(redisKey, function (err, redisResponse) {
                    if (err) reject(err);
                    if (typeof redisResponse === 'object') {
                        redisResponse.previousTimeStamp = redisResponse.timeStamp;
                        resolve(redisResponse);
                    } else {
                        // initialize  Redis Object Model and check whether it is present in db or not 
                        let res = redisObjectModel;
                        //machine_system_id
                        const machineInfo = myUtils.filterByKeyValue(initData.machineTypeList, 'machine_system_id', resPlexusData.machineID);
                        if (machineInfo) {
                            res.machineInfo.device_type = machineInfo.device_type;
                            res.machineInfo.machine_type = machineInfo.machine_type;
                        }
                        res.key = redisKey;
                        res.currentDate = currentDate;
                        res.machineId = resPlexusData.machineID;

                        let alertPromise = new Promise((alertResolve, alertReject) =>
                            alertController.updateAlertPriorityStatusRedis(alertResolve, alertReject, res));
                        alertPromise.then((alertResponse) => {
                            res.alerts = alertResponse;
                            resolve(res);
                        }).catch(err => {
                            logger.error(`fn: message:${JSON.stringify(err)} Error in setting the data for alerts`);
                            resolve(res); // still it should not stop the other inserting flow
                        });
                    }
                });
                // Pass Redis Response
            }).then((redisResponse) => {
                resPlexusData.currentDate = currentDate;
                resPlexusData.redisKey = redisKey;

                let prevWashCycle = redisResponse.washCycle;

                /* Calculate Rinse Time, Wash Time, Wash Cycle, Rine Water and  user Efficiency  */
                liveAggregation.processTriggers(resPlexusData, redisResponse, redisResponse.machineInfo);

                // Calculate Total Fill Water and Fill Cycle(Number of Fill count)
                fillWaterCal.fillWater(resPlexusData, redisResponse.machineInfo.device_type, redisResponse);

                //  Calculate Energy Consumption
                energyConsumption.aggregatedEnergyConsumption(resPlexusData, redisResponse, redisResponse.machineInfo.device_type);

                // Calculate AlarmThreshold values
                alarmthreshold.alarmThreshold(resPlexusData, redisResponse.machineInfo.device_type, redisResponse);

                if (redisResponse.washCycle > prevWashCycle) {
                    // Make a call to check for alerts
                    redisResponse = alertController.setOrClearAlert(redisResponse);
                    washCycleChangeFlag = true;
                }


                // Up-date Redis Object
                redisResponse.timeStamp = resPlexusData.time_stamp;
                redisResponse.syncToken = resPlexusData.sync_token;
                redisResponse.triggers = resPlexusData.triggers;

                //get Current dbUpdate Flag
                let tempdbUpdate = redisResponse.dbUpdate;

                //reset dbUpdate Flag
                redisResponse.dbUpdate = redisObjectModel.dbUpdate;
                redisConn.updateValue(redisKey, redisResponse, (err, res) => {
                    if (!err) {
                        //Set Current dbUpdate Flag
                        logger.info(`-----------------End "${redisKey}-${resPlexusData.time_stamp}"---------------`);
                    }
                });
                redisResponse.dbUpdate = tempdbUpdate;
                return redisResponse;
            }).then((updatedRedisResponse) => {
                // logger.info("--->\n" + JSON.stringify(updatedRedisResponse));

                //  enerygy_consumption, fill_water, rinse_water, usage_efficiency, water_change
                let parametersRealtimeObject = new parametersRealtime(updatedRedisResponse.energyConsumption.totalEnergy, updatedRedisResponse.fillWater.totalFillWater, updatedRedisResponse.rinseCalculation.totalRinseWater, updatedRedisResponse.usageEfficiency,
                    updatedRedisResponse.fillWater.waterFillCount);

                let alarmThresholdParams = [updatedRedisResponse.alarmThreshold.preWashStatus, updatedRedisResponse.alarmThreshold.rinseTemperatureStatus, updatedRedisResponse.alarmThreshold.washTemperatureStatus,
                updatedRedisResponse.alarmThreshold.detergentConcentrationStatus, updatedRedisResponse.rinseCalculation.avgRinseWaterflowRate, updatedRedisResponse.rinseCalculation.avgRinseFlowRateStatus, updatedRedisResponse.machineId, String(updatedRedisResponse.timeStamp)
                ];

                cassandraClient.updateParametersRealtime(resPlexusData.machineID, resPlexusData.timeuuid,
                    resPlexusData.site_time, resPlexusData.time_stamp, parametersRealtimeObject, alarmThresholdParams,
                    () => {
                        return;
                    }
                );

                cassandraClient.machineKpi(updatedRedisResponse, () => {
                    return;
                });
                
                if (washCycleChangeFlag == true) {
                    cassandraClient.alerts(updatedRedisResponse, (err, result) => {
                        if (err) {
                            return;
                        }
                        
                    });
                }

                updatedRedisResponse = null;
                //    logger.error(JSON.stringify(updatedRedisResponse));
                return;
            }).catch(err => {
                logger.error(`watchPlexusDataEngine error:${err}`);
            });
        }
    } else {
        logger.warn(`Triggers value is ${triggers}`);
    }
    //}
    //} catch (e) {
    //  logger.error(`Error in trigger parse ${JSON.stringify(e)}`);
    //}

});