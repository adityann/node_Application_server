const logger = require('../../startup/logger');
const Joi = require('joi');
const hygiene = require('../../model/hygieneModel');
const redisObject = require('../../model/redisObjectModel');
const utils = require('../../util/utils');

module.exports = {
    insertOrUpdateParameterHygieneInRedis: parameterHygiene,
    insertOrUpdateParameterHygieneInDB: parameterHygieneAvg
}

/**
 * 
 * @param {*} resPlexusData 
 * @param {*} redisResponse 
 * @param {*} conveyorFlag 
 * @param {*} doorRinseFlag 
 */
function parameterHygiene(resPlexusData, redisResponse, conveyorFlag, doorRinseFlag) {
    try {
        let hygieneParams = new hygiene(resPlexusData.sensorData.Wash_Temperature, resPlexusData.sensorData.Pre_Wash_Temperature, resPlexusData.sensorData.Rinse_Temperature, resPlexusData.sensorData.C3M_Conductivity_Beta_Units);
        logger.debug(`fn:parameterHygiene-${resPlexusData.machineID}-${resPlexusData.time_stamp} hygieneParams:${JSON.stringify(hygieneParams)}  redisResponse:${JSON.stringify(redisResponse.hygiene.parameters)}`);

        if (!doorRinseFlag) {
            if (hygieneParams.washTemp > 0) {
                redisResponse.hygiene.parameters.cumulativeWashTemp = redisResponse.hygiene.parameters.cumulativeWashTemp + hygieneParams.washTemp;
                redisResponse.hygiene.parameters.washTempCount = redisResponse.hygiene.parameters.washTempCount + 1;
            }
            if (hygieneParams.rinseTemp > 0 && conveyorFlag == true) {
                redisResponse.hygiene.parameters.cumulativeRinseTemp = redisResponse.hygiene.parameters.cumulativeRinseTemp + hygieneParams.rinseTemp;
                redisResponse.hygiene.parameters.rinseTempCount = redisResponse.hygiene.parameters.rinseTempCount + 1;
            }
            if (hygieneParams.detergentConcentration > 0) {
                redisResponse.hygiene.parameters.cumulativeDetergentConcentration = redisResponse.hygiene.parameters.cumulativeDetergentConcentration +
                    hygieneParams.detergentConcentration;
                redisResponse.hygiene.parameters.detergentConcentrationCount = redisResponse.hygiene.parameters.detergentConcentrationCount + 1;
            }
            if (hygieneParams.preWashTemp > 0) {
                redisResponse.hygiene.parameters.cumulativePreWashTemp = redisResponse.hygiene.parameters.cumulativePreWashTemp + hygieneParams.preWashTemp;
                redisResponse.hygiene.parameters.preWashTempCount = redisResponse.hygiene.parameters.preWashTempCount + 1;
            }
        } else {
            redisResponse.hygiene.parameters.cumulativeRinseTemp = redisResponse.hygiene.parameters.cumulativeRinseTemp + hygieneParams.rinseTemp;
            redisResponse.hygiene.parameters.rinseTempCount = redisResponse.hygiene.parameters.rinseTempCount + 1;
        }

        logger.debug(`fn:parameterHygiene-${resPlexusData.machineID}-${resPlexusData.time_stamp}  updatedRedisResponse:${JSON.stringify(redisResponse.hygiene.parameters)}`);
    } catch (err) {
        logger.error(`fn:parameterHygiene-${resPlexusData.machineID}-${resPlexusData.time_stamp} errorDescripton:-${JSON.stringify(err)} redisResponse:${JSON.stringify(redisResponse.hygiene)}`);

    }
}

/**
 * 
 * @param {*} redisResponse 
 */
function parameterHygieneAvg(redisResponse) {

    redisResponse.hygiene.average.washTemp = utils.calculateAverage(redisResponse.hygiene.parameters.cumulativeWashTemp, redisResponse.hygiene.parameters.washTempCount);
    redisResponse.hygiene.average.rinseTemp = utils.calculateAverage(redisResponse.hygiene.parameters.cumulativeRinseTemp, redisResponse.hygiene.parameters.rinseTempCount);
    redisResponse.hygiene.average.detergentC = utils.calculateAverage(redisResponse.hygiene.parameters.cumulativeDetergentConcentration, redisResponse.hygiene.parameters.detergentConcentrationCount);
    redisResponse.hygiene.average.preWash = utils.calculateAverage(redisResponse.hygiene.parameters.cumulativePreWashTemp, redisResponse.hygiene.parameters.preWashTempCount);

    // reset hygiene.parameters after washCycle Completed
    redisResponse.hygiene.parameters = redisObject.hygiene.parameters;
    redisResponse.dbUpdate.hygiene = 1;

    logger.debug(`fn:parameterHygieneAvg-${redisResponse.machineId}-${redisResponse.previousTimeStamp}  updatedRedisResponse:${JSON.stringify(redisResponse.hygiene)}`);
}