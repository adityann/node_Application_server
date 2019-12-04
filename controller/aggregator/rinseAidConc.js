const socketIO = require('../../util/socketIO')
const logger = require('../../startup/logger')

module.exports = {
    rinseAidConcentraion: rinseAidConcentraion
}


function rinseAidConcentraion(machineID, feederStatus, timeStamp) {
    let rinse_aid_concentraion_status = '0';

    if (feederStatus[0] === 'g') {
        rinse_aid_concentraion_status = '2';
    } else if (feederStatus[0] === 'r') {
        rinse_aid_concentraion_status = '1';
    }

    let data = {
        machineID: machineID,
        rinse_aid_concentration_status: rinse_aid_concentraion_status
    }
    logger.debug(`fn:rinseAidConcentraion${machineID}-${timeStamp}  rinse_aid_concentraion_status:${rinse_aid_concentraion_status}`)

    socketIO.sendLiveData(machineID, data)

}