const logger = require('../../startup/logger');
const initData = require('../../startup/init');
const utilFunction = require("../../util/utils");
const machine = require('../../config/commonFlagVaraible');
const socketIO = require('../../util/socketIO');
const kpiKey = require('../../config/commonFlagVaraible').kpi.keys;



module.exports = {
    getRinseWaterMeasured: getRinseWaterMeasured
}


function getRinseWaterMeasured(resPlexusData, redisResponse, getMachine) {
    //    try {
    /**
     * rinseWaterMeter and fillWaterMeter
     */

    if (redisResponse.rinseCalculation.rinseWaterMeter == null && redisResponse.rinseCalculation.fillWaterMeter == null && redisResponse.rinseCalculation.fillTrigger == null) {
        const machineWaterMeter = utilFunction.filterByMultipleKeysValues(initData.machineInstalledSensorList, {
            'device_id': resPlexusData.machineID,
            "sensor_name": "RinseWaterMeter,FillWaterMeter,FillTrigger"
        });
        let waterMeterObject = {}
        machineWaterMeter.forEach(element => {

            waterMeterObject[element.sensor_name] = element.status
        });
        if ((waterMeterObject.RinseWaterMeter == 1) && (waterMeterObject.FillWaterMeter == 1)) {
            redisResponse.rinseCalculation.rinseWaterMeter = 1;
            redisResponse.rinseCalculation.fillWaterMeter = 1;
        }
        if (waterMeterObject.FillTrigger == 1) {
            redisResponse.rinseCalculation.fillTrigger = 1;
        } else {
            redisResponse.rinseCalculation.fillTrigger = 0;
        }
    }
    logger.debug(`fn:getRinseWaterMeasured(): machineId:${resPlexusData.machineID}  redisResponse.rinseCalculation.rinseWaterMeter:${redisResponse.rinseCalculation.rinseWaterMeter} redisResponse.rinseCalculation.fillWaterMeter: ${redisResponse.rinseCalculation.fillWaterMeter} redisResponse.rinseCalculation.fillTrigger: ${redisResponse.rinseCalculation.fillTrigger} "`);

    if (getMachine.device_type == 'pro' &&
        (redisResponse.rinseCalculation.rinseWaterMeter == 1 || redisResponse.rinseCalculation.fillWaterMeter == 1)) {
        if (machine.machineType.conveyorMachineType.includes(getMachine.machine_type)) {
            //check for fill trigger
            if (redisResponse.rinseCalculation.fillTrigger == 0) {
                //rinse trigger is on and wash trigger is off OR rinse trigger turned from on to off and wash trigger is off
                if (resPlexusData.triggers.wash == 0 &&
                    (resPlexusData.triggers.rinse == 1 ||
                        (redisResponse.triggers.rinse == 1 && resPlexusData.triggers.rinse == 0))) {
                    calculateWaterConsumption(resPlexusData, redisResponse, "fillFlag");
                } else {
                    calculateWaterConsumption(resPlexusData, redisResponse, "washFlag");
                }
                //fill trigger is on  OR fill trigger turned from on to off

            } else {
                if ((resPlexusData.triggers.fill == 1) ||
                    (redisResponse.triggers.fill == 1 && resPlexusData.triggers.fill == 0)) {
                    calculateWaterConsumption(resPlexusData, redisResponse, "fillFlag");
                } //wash trigger is on OR wash trigger turned from on to off.
                else {
                    calculateWaterConsumption(resPlexusData, redisResponse, "washFlag");
                }
            }

        } else if (machine.machineType.doorMachineType.includes(getMachine.machine_type)) {



            //check for fill trigger
            if (redisResponse.rinseCalculation.fillTrigger == 0) {
                //rinse trigger is on and wash flag is false  OR flag is false and rinse trigger turned from on to off
                if (redisResponse.isWashFlagWasOn == false && (resPlexusData.triggers.rinse == 1 || (redisResponse.triggers.rinse == 1 && resPlexusData.triggers.rinse == 0))) {
                    calculateWaterConsumption(resPlexusData, redisResponse, "fillFlag");
                } else {
                    calculateWaterConsumption(resPlexusData, redisResponse, "washFlag");
                }
            } else if (redisResponse.rinseCalculation.fillTrigger == 1) {

                if ((resPlexusData.triggers.fill == 1) ||
                    (redisResponse.triggers.fill == 1 && resPlexusData.triggers.fill == 0)) {
                    calculateWaterConsumption(resPlexusData, redisResponse, "fillFlag");
                } //wash trigger is on OR wash trigger turned from on to off.
                else {
                    calculateWaterConsumption(resPlexusData, redisResponse, "washFlag");
                }

            }
        }

    } else {
        logger.info(`Machine is not pro...`)
    }
    // } catch (error) {

    //  }
}



/**
 * 
 * @param {*} resPlexusData 
 * @param {*} redisResponse 
 */
function calculateWaterConsumption(resPlexusData, redisResponse, washFillFlag) {
    try {

        let currentWaterMeterPulseCount = Number(resPlexusData.sensorData.Rinse_Water);
        let lastWaterMeterPulseCount = redisResponse.rinseCalculation.WaterMeterPulseCount;

        let socketObject = {
            machineID: resPlexusData.machineID
        }

        if (redisResponse.rinseCalculation.literPerPulse) {
            if (resPlexusData.sync_token == redisResponse.syncToken && (currentWaterMeterPulseCount > lastWaterMeterPulseCount)) {
                if (washFillFlag == "washFlag") {
                    redisResponse.rinseCalculation.rinseWaterWashing = redisResponse.rinseCalculation.rinseWaterWashing + ((currentWaterMeterPulseCount - lastWaterMeterPulseCount) * redisResponse.rinseCalculation.literPerPulse);
                    redisResponse.dbUpdate.accRinseWaterWashing = 1;
                    socketObject[kpiKey.rinse_water_washing] = redisResponse.rinseCalculation.rinseWaterWashing;

                } else {
                    redisResponse.rinseCalculation.rinseWaterFilling = redisResponse.rinseCalculation.rinseWaterFilling + ((currentWaterMeterPulseCount - lastWaterMeterPulseCount) * redisResponse.rinseCalculation.literPerPulse);
                    redisResponse.dbUpdate.accRinseWaterFilling = 1;
                    socketObject[kpiKey.rinse_water_Filling] = redisResponse.rinseCalculation.rinseWaterFilling;
                }
                redisResponse.rinseCalculation.totalRinseWater = redisResponse.rinseCalculation.rinseWaterWashing + redisResponse.rinseCalculation.rinseWaterFilling;
                redisResponse.dbUpdate.accRinseWater = 1;
            } else if (resPlexusData.sync_token != redisResponse.syncToken) {
                if (washFillFlag == "washFlag") {
                    redisResponse.rinseCalculation.rinseWaterWashing = redisResponse.rinseCalculation.rinseWaterWashing + (currentWaterMeterPulseCount * redisResponse.rinseCalculation.literPerPulse);
                    redisResponse.dbUpdate.accRinseWaterWashing = 1;
                    socketObject[kpiKey.rinse_water_washing] = redisResponse.rinseCalculation.rinseWaterWashing;
                } else {
                    redisResponse.rinseCalculation.rinseWaterFilling = redisResponse.rinseCalculation.rinseWaterFilling + (currentWaterMeterPulseCount * redisResponse.rinseCalculation.literPerPulse);
                    redisResponse.dbUpdate.accRinseWaterFilling = 1;
                    socketObject[kpiKey.rinse_water_Filling] = redisResponse.rinseCalculation.rinseWaterFilling;
                }
                redisResponse.rinseCalculation.totalRinseWater = redisResponse.rinseCalculation.rinseWaterWashing + redisResponse.rinseCalculation.rinseWaterFilling;
                redisResponse.dbUpdate.accRinseWater = 1;
                socketObject[kpiKey.rinse_water] = redisResponse.rinseCalculation.totalRinseWater;
            }

        } else {
            const machineRinseInfo = utilFunction.filterByMultipleKeysValues(initData.machineWaterInfoList, {
                'device_id': resPlexusData.machineID,
                "meter_type": 'rinse'
            });
            redisResponse.rinseCalculation.literPerPulse = machineRinseInfo[0].liter_per_pulse;
            if (washFillFlag == "washFlag") {
                redisResponse.rinseCalculation.rinseWaterWashing = currentWaterMeterPulseCount * machineRinseInfo[0].liter_per_pulse;
                redisResponse.dbUpdate.accRinseWaterWashing = 1;
                socketObject[kpiKey.rinse_water_washing] = redisResponse.rinseCalculation.rinseWaterWashing;

            } else {
                redisResponse.rinseCalculation.rinseWaterFilling = currentWaterMeterPulseCount * machineRinseInfo[0].liter_per_pulse;
                redisResponse.dbUpdate.accRinseWaterFilling = 1;
                socketObject[kpiKey.rinse_water_Filling] = redisResponse.rinseCalculation.rinseWaterFilling;

            }
            redisResponse.rinseCalculation.totalRinseWater = redisResponse.rinseCalculation.rinseWaterWashing + redisResponse.rinseCalculation.rinseWaterFilling;
            redisResponse.dbUpdate.accRinseWater = 1;
            socketObject[kpiKey.rinse_water] = redisResponse.rinseCalculation.totalRinseWater;

        }
        socketIO.sendLiveData(resPlexusData.machineID, socketObject);

        redisResponse.rinseCalculation.WaterMeterPulseCount = currentWaterMeterPulseCount;
        logger.debug(`fn:calculateWaterConsumption(): machineId:${resPlexusData.machineID} redisResponse.rinseCalculation.totalRinseWater:${redisResponse.rinseCalculation.totalRinseWater}"`)

        return redisResponse;
    } catch (err) {
        logger.error(`fn:rinseWaterCalculation machineId:${resPlexusData.machineID} error:${JSON.stringify(err)}`);
    }

}