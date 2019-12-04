const socketIO = require('../../util/socketIO');
const logger = require('../../startup/logger');
const myUtils = require('../../util/utils');
module.exports = {
    dispenserLightStatus: dispenserLightStatus
}

function dispenserLightStatus(snapData) {
    try {
        let colorList = myUtils.dispenserLightsColor(snapData.feeder_status_ss);
        let data = {
            machineID: snapData.machineID,
            'lights_status': colorList
        }
        logger.debug(`lights status ${data.lights_status}`);
        socketIO.sendLiveData(snapData.machineID, data);
    } catch (e) {
        logger.error(`*****error in snapshotData******: ${e}`);
    }
}