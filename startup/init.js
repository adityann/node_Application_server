'use strict';

const logger = require('./logger');
const mysql_client = require('../util/db/mysql/mysql_client');
const mysql_ddl = require('../util/db/mysql/mysql_ddl');
const cassandraConnection = require('./cassandraConnection');
const cassandra_ddl = require('../util/db/cassandra/cassandra_ddl');
const redis_con=require('../util/redis/redisConnection');

exports.machineTypeList = [];
exports.machineInstalledSensorList = [];
exports.machineWaterInfoList = [];
exports.machineTankVolumeList = [];
exports.machineEnergyMeterList = [];
exports.alarmthreshholdTempList = [];
exports.utcTime = [];
exports.organisationName = [];
exports.rackCountList = [];
exports.alertCount = null;
exports.nominalRinseFlowRate=[];

/**
 * list of organisation name
 */
try {
    // redis_con.checkUpdateByKey("machineTypeList",()=>{
        
    // })
    mysql_client.executeQuery(mysql_ddl.select.getOrganisationName, (error, rows) => {
        if (error) throw error;
        exports.organisationName = rows
        logger.info(`method:init message:Organisation name datacount:${exports.organisationName.length} `)
    })
} catch (e) {
    logger.error("fn:init message:Error in Mysql 'organisation name' description:" + JSON.stringify(e));
}


/**
 * list of Alarm threshold list for all machine 
 */

try {
    mysql_client.executeQuery(mysql_ddl.select.getalarm_threshold, function (error, rows) {
        if (error) throw error;
        exports.alarmthreshholdTempList = rows;
        logger.info(`method:init message:'alarm threshold list'  dataCount:${exports.alarmthreshholdTempList.length}`);
        //logger.debug(`method:init message:'alarm threshold list` + JSON.stringify(exports.alarmthreshholdTempList));
    });
} catch (e) {
    logger.error("fn:init message:Error in Mysql 'preWashTempList' description:" + JSON.stringify(e));
}

try {
    mysql_client.executeQuery(mysql_ddl.select.getMachineEnergyPulseRate, function (error, rows) {
        if (error) throw error;
        exports.machineEnergyMeterList = rows;
        logger.info(`methord:init message:'machine Energy Meter'  dataCount:${exports.machineEnergyMeterList.length}`);
    });
} catch (e) {
    logger.error("fn:init message:Error in Mysql 'getMachineEnergyPulseRate' description:" + JSON.stringify(e));
}


try {
    mysql_client.executeQuery(mysql_ddl.select.getMachineTankVolumeCapacity, function (error, rows) {
        if (error) throw error;
        exports.machineTankVolumeList = rows;
        logger.info(`methord:init message:'machine Tank Volume Capacity'  dataCount:${exports.machineTankVolumeList.length}`);
    });
} catch (e) {
    logger.error("fn:init message:Error in Mysql 'getMachineTankVolumeCapacity' description:" + JSON.stringify(e));
}

try {
    mysql_client.executeQuery(mysql_ddl.select.getAllAssets, function (error, rows) {
        if (error) throw error;
        exports.machineTypeList = rows;
        logger.info(`methord:init message:'All Machine Type'  dataCount:${exports.machineTypeList.length}`);
    });
} catch (e) {
    logger.error("fn:init message:Error in Mysql 'getAllAssets' description:" + JSON.stringify(e));
}


//All List Of installed Sensor with machine-Id from DataBase
try {
    mysql_client.executeQuery(mysql_ddl.select.getInstalledSensor, function (error, rows) {
        if (error) throw error;
        exports.machineInstalledSensorList = rows;
        logger.info(`methord:init message:'Machine Installed Sensor'  dataCount:${exports.machineInstalledSensorList.length}`);
    });
} catch (e) {
    logger.error("fn:init message:Error in Mysql 'getInstalledSensor' description:" + JSON.stringify(e));

}


//for fill water calculation
try {
    mysql_client.executeQuery(mysql_ddl.select.getMachineWaterInfo, function (error, rows) {
        if (error) throw error;
        exports.machineWaterInfoList = rows;
        logger.info(`methord:init message:'list of all machine info for rinse/fill water'  dataCount:${exports.machineWaterInfoList.length}`);
    });
} catch (e) {
    logger.error("fn:init message:Error in Mysql 'getMachineWaterInfo' description:" + JSON.stringify(e));
}

try {
    mysql_client.executeQuery(mysql_ddl.select.getUTCTime, function (error, rows) {
        if (error) throw error;
        exports.utcTime = rows;
        logger.info(`methord:init message:'list of all machine utcTime'  dataCount:${exports.utcTime.length}`);
    });
} catch (e) {
    logger.error("fn:init message:Error in Mysql 'getUTCTime' description:" + JSON.stringify(e));
}

/**
 * List of Rack count wrt machineID used in wash cycle
 */

try {
    mysql_client.executeQuery(mysql_ddl.select.getRackCountDetails, (error, rows) => {
        if (error) throw error;
        exports.rackCountList = rows
        logger.info(`method:init message:'list of all machine rack count'  datacount:${exports.rackCountList.length} `)
    })

} catch (e) {
    logger.error("fn:init message:Error in Mysql 'machine rack count' description:" + JSON.stringify(e));
}

// Alert Count 

try {
    cassandraConnection.execute(cassandra_ddl.select.getAlertCount, (err, response) => {
        if (err) {
            logger.error(`fn:init message: Error retrieving alert count error:${JSON.stringify(err)} `)
        }
        exports.alertCount = response.rows[0].count || 0;
        logger.info(`fn:init message:Alert details count:${exports.alertCount}`);
    })

} catch (e) {
    logger.error("fn:init message:Error in Cassandra 'Alert count' description:" + JSON.stringify(e));
}

try {
    mysql_client.executeQuery(mysql_ddl.select.getMachineNominalRinse, (error, rows) => {
        if (error) throw error;
        exports.nominalRinseFlowRate = rows
        logger.info(`method:init message:'list of all machine with nominal rinse flow rate'  datacount:${exports.nominalRinseFlowRate.length} `)
    })

} catch (e) {
    logger.error("fn:init message:Error in Mysql 'machine rinse flow rate count' description:" + JSON.stringify(e));
}