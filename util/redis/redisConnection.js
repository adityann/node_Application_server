const logger = require('../../startup/logger');
const client = require('../../startup/redisConnection');
var fs = require('fs')
var path = require('path')
var time = require('../../util/utils')
const cass_con = require('../db/cassandra/cassandra_client')
const cass_ddl = require('../db/cassandra/cassandra_ddl')
const redisObject = require('../../model/redisObjectModel')


module.exports = {
  getValueByKey: redisGetJsonResponse,
  updateValue: redisUpdateJson,
  checkUpdateByKey: checkUpdateByKey,
  redisObjectCheck: redisObjectCheck
};


/**
 * 
 * @param {*} key 
 */
function redisObjectCheck(key) {
  checkTriggeFromCache(key, (err, res) => {
    if (!res) {
      cass_con.lookUPCassandraRedis(key.split("_")[1], key.split("_")[0], (err, res) => {
        if (res != "NO-DATA") {
          let object = redisObject
          var kpiParser = {
            "wash_time": object.washTime,
            "rinse_time": object.rinseTime,
            "machine_efficiency": object.usageEfficiency,
            "wash_cycle": object.washCycle,
            "fill_water": object.fillWater.totalFillWater,
            "fill_count": object.fillWater.waterFillCount,
            "rinse_water": object.rinseCalculation.totalRinseWater,
            "energy_consumption": object.energyConsumption.totalEnergy,
          }
          object.machineId = key.split("_")[1]
          for (var i = 0; i < res.length; i++) {
            object.kpiParser[res[i].kpi] = res[i].value
          }
          insertTriggerDataToCache(key, object)
          logger.info("Succesfully added redis model object from cassandra to redis")
          return 1
        } else {
          return 0
        }
      })
    } else {
      return 0
    }

  })
}
// id-trigger(fill/wash/rinse) flag -true/false
function insertTriggerDataToCache(id, stringOrObject) {
  // var currentTime = Date.now()
  client.set([id, stringOrObject], function (err, res) {
    if (err) {
      logger.error(`Redis-Insert-:${id} message:${err}`);
    } else {
      // var data = 'redis check------- systemTime:' + currentTime.toString() +'||Time:' +time.getExecutionTime(currentTime)  + '\n'
      // fs.appendFile(path.join(__dirname, '../../logs/redis.txt'), data, function (err, data) {
      //     if (err) {
      //         logger.error(`fn: watchPlexusData.timeWrite error:${JSON.stringify(err)}`)

      //     }

      // })
      logger.debug(`Redis_Insert-${id} insertedData:${JSON.stringify(stringOrObject)}`);
    }
  });
}


// id-trigger(fill/wash/rinse)
function removeTriggerDataToCache(id) {
  // var currentTime = Date.now()
  client.del(id, function (err, res) {
    if (err) {
      logger.error(`Redis_Removed id:${id} message:${String(err)}`);
    } else {
      // var data = 'redis check------- systemTime:' + currentTime.toString() +'||Time:' +time.getExecutionTime(currentTime)  + '\n'
      // fs.appendFile(path.join(__dirname, '../../logs/redis.txt'), data, function (err, data) {
      //     if (err) {
      //         logger.error(`fn: watchPlexusData.timeWrite error:${JSON.stringify(err)}`)

      //     }

      // })

      logger.info(`Redis_Removed-${id}`);
    }

  });

}

// 
function checkTriggeFromCache(redisKey, cb) {
  // var currentTime = Date.now()
  client.get(redisKey, function (err, res) {
    if (err) {
      logger.error(`Redis_Check-${redisKey} message:${String(err)}`);
      cb(err, null);

    } else {
      // var data = 'redis check------- systemTime:' + currentTime.toString() +'||Time:' +time.getExecutionTime(currentTime)  + '\n'
      // fs.appendFile(path.join(__dirname, '../../logs/redis.txt'), data, function (err, data) {
      //     if (err) {
      //         logger.error(`fn: watchPlexusData.timeWrite error:${JSON.stringify(err)}`)

      //     }

      // })
      logger.debug(`Redis_Check-${id} response:${String(res)}`);
      cb(null, res);

    }

  });
}

function checkUpdateByKey(redisObject, cb) {
  client.get(redisObject.key, (err, res) => {
    if (err) {
      client.set(redisObject.key, redisObject.value, (errSet) => {
        if (errSet) {
          cb(errSet, null);
        } else {
          cb(null, redisObject.key + " update");
        }
      });
    } else {
      cb(null, res);
    }
  })

}

/**
 * 
 * @param {*} redisKey 
 * @param {*} jsonObject 
 */

function redisUpdateJson(redisKey, jsonObject, cb) {

  let jsonStr = JSON.stringify(jsonObject);

  client.set(redisKey, jsonStr, function (err, res) {
    if (err) {
      logger.error(`${redisKey}-${jsonObject.previousTimeStamp}-redisUpdate errorDescription:${JSON.stringify(err)}`);
      cb(err, null);
    } else {
      logger.debug(`${redisKey}-${jsonObject.previousTimeStamp}-redisUpdate redisUpdate:${jsonStr}`);
      cb(null, err);
    }
  });
}

function redisGetJsonResponse(redisKey, cb) {
  client.get(redisKey, function (err, res) {
    if (err) {
      logger.error(`${redisKey}-redisGet errorDescription:${JSON.stringify(err)}`);
      cb(err, null);
    } else {
      if (res) {
        let response = JSON.parse(res);
        logger.debug(`${redisKey}-${response.timeStamp}-redisGet redisResponse:${res}`);
        cb(null, response);
      } else {
        logger.debug(`${redisKey}-redisGet redisResponse:${res}`);
        cb(null, "noRecord");
      }
    }
  });
}
//*********************Completed here *************/