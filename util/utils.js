const logger = require('../startup/logger');
const init = require('../startup/init');
const inMemory = require('../startup/init');

var inMemoryStoreKpi = {};

module.exports = {
  calculateTime: calculateTime,
  timezone: timezone,
  epoch_date: epoch_date,
  currentDateTime: currentDateTime,
  filterByKeyValue: filterByKeyValue,
  dispenserLightsColor: dispenserLightsColor,
  filterByMultipleKeysValues: filterByMultipleKeysValues,
  getExecutionTime: getExecutionTime,

  calculateSumFromArray: calculateSumFromArray,
  calculateAverage: calculateAverage,
  celsiusFahrenheit: convertCelsiusToFahrenheit,
  litreGallon: litreGallon,
  dateTime: dateTime,
  toFixed: toFixed

}



function timezone(entry) {
  var time = entry.slice(4);
  var ans = entry.slice(3, 4);
  if (parseInt(time) > 12) {
    if (time.length > 3) {
      ans += time.slice(0, 2) + ":" + time.slice(2);
    } else {
      ans += ("0" + time.slice(0, 1) + ":" + time.slice(1));
    }
  } else if (parseInt(time) <= 12) {
    if (parseInt(time) in [10, 11, 12]) {
      ans += time + ":00"
    } else {
      ans += "0" + time + ":00"
    }

  }
  return ans
}
/**
 * 
 * @param {*} currentEpochTime 
 * @param {*} previousEpochTime 
 */

function calculateTime(currentEpochTime, previousEpochTime) {
  if (typeof currentEpochTime === "number" && typeof previousEpochTime === "number" && currentEpochTime >= previousEpochTime)
    return currentEpochTime - previousEpochTime;
  else
    logger.warn(`fn:calculateTime new time ${currentEpochTime} old time ${previousEpochTime}`);
  return 0;
}

/**
 * 
 * @param {*} objects 
 * @param {*} key 
 * @param {*} value 
 * @param {*} flag 
 */

function filterByKeyValue(objects, key, value, flag) {
  if (objects && key && value) {
    let obj = objects.filter((object) => {
      return object[key] == value;

    });
    if (flag) {
      return obj;
    }
    logger.debug(`methord:filterByKeyValue key:${key} value:${value} returnObject:${JSON.stringify(obj)}`);

    if (obj.length > 0) {
      return obj[0];
    } else {
      return null;
    }
  }
}



/**
 * 
 * @param {Epoc time(second)} epochTime 
 * @param {Machine Id} id 
 */
function currentDateTime(epochTime, id) {
  let act_epochTime = null;

  if (epochTime && id) {
    let machine_UTC_Time = null;
    try {
      machine_UTC_Time = filterKeyValue(inMemory.utcTime, 'machine_system_id', id).time_zone;
      let utcNumeric = machine_UTC_Time.slice(3).length >= 4 ? machine_UTC_Time.slice(3) / 100 : machine_UTC_Time.slice(3);
      act_epochTime = epochTime + (utcNumeric * 3600);
      let date = new Date(0);
      let dateTime = date.setUTCSeconds(act_epochTime);

      logger.debug(`fn:currentDateTime machine:${id} epochTime:${epochTime}/act_epochTime:${act_epochTime} UTC_Time:${machine_UTC_Time} `);
      return dateTime
    } catch (e) {
      logger.error(`fn:currentDateTime machine:${id} epochTime:${epochTime}/act_epochTime:${act_epochTime} UTC_Time:${machine_UTC_Time} error:${JSON.stringify(e)}`);
      return act_epochTime;
    }
  } else {
    logger.warn(`fn:currentDateTime message:epocTime(${epochTime})-Id(${id}) is null error:${JSON.stringify(e)} `);
    return act_epochTime;
  }
}
/**
 * 
 * @param {*} epoch_time (epoc time)
 * @param {*} m_id (machine id)
 */

function epoch_date(epoch_time, m_id) {

  try {
    if (typeof epoch_time === 'string') {
      epoch_time = Number(epoch_time);
    }
    let machine_UTC_Time = null;
    if (typeof epoch_time === 'number') {
      machine_UTC_Time = filterByKeyValue(init.utcTime, 'machine_system_id', m_id);
      if (machine_UTC_Time) {
        machine_UTC_Time = machine_UTC_Time.time_zone
        let utcNumeric = machine_UTC_Time.slice(3).length >= 4 ? machine_UTC_Time.slice(3) / 100 : machine_UTC_Time.slice(3)

        let act_epoch_time = epoch_time - 10800 + (utcNumeric * 3600);

        let dConv = new Date(0);
        dConv.setUTCSeconds(act_epoch_time);
        dConv = dConv.toISOString().replace('T', ' ');
        let actualDate = dConv.split(' ')[0];
        logger.debug(`epoch_date:${m_id}-${epoch_time} message:${act_epoch_time}-->${actualDate} utcTimeZone:${machine_UTC_Time}`);
        return actualDate;
      } else {
        logger.warn(`epoch_date:${m_id}-${epoch_time}  message:'time_zone is not found '`);
      }
    } else {
      logger.error(`epoch_date:${m_id}-${epoch_time}  message:'Error in epoch_time'`);
      return null;
    }
  } catch (e) {
    logger.error(`epoch_date:${m_id}-${epoch_time} message:"catch Error"  error:${JSON.stringify(e)}`);
    return null
  }
}

/**
 * dispenser lights color.
 * @param {dispensers list and code } colorCode 
 */
function dispenserLightsColor(colorCode) {
  let colorList = [];
  if (typeof colorCode == 'string') {
    for (let i = 0; i < colorCode.length; i++) {
      let color = getLightColorByCode(colorCode[i]);
      colorList.push(color);
    }
  }
  return colorList;
}

/**
 * 
 * @param {*} code 
 */
function getLightColorByCode(code) {
  switch (code) {
    case 'g':
      return 'lightgreen'; // online no error
    case 'x':
      return 'black'; // offline
    case 'f':
      return 'darkgreen'; //feeding
    case 'y':
      return 'yellow'; // disabled
    case 'b':
      return 'blue'; // no water
    case 'r':
      return 'red'; // out of product
    default:
      return 'white'; // new code if exists
  }
}

/**
 * 
 * @param {*} objects Arrays of Object(key:value) 
 * @param {*} filterBy Object By keysValues (filterBy = { key: value, "key": value };)
 */
function filterByMultipleKeysValues(objects, filterBy) {
  if (typeof objects === 'object' && typeof filterBy === 'object') {
    const keys = Object.keys(filterBy),
      values = Object.values(filterBy).toString().split(",");
    if (keys.length <= values.length) {
      let filterObject = objects.filter(function (object) {
        return keys.every(function (key) {
          return values.includes(object[key]);
        });
      });
      logger.debug(`fn:filterByMultipleKeysValues filterObject:${JSON.stringify(filterObject)} filterBy:${JSON.stringify(filterBy)}`);
      return filterObject;
    } else {
      logger.error(`fn:filterByMultipleKeysValues message:'Invalid Keys/Values' objects:${objects.length} filterBy:${filterBy}`);
      return [];
    }
  } else {
    logger.error(`fn:filterByMultipleKeysValues message:'Invalid Arrays/filterBy' objectsLength:${objects.length} filterBy:${filterBy}`);
    return [];

  }
}
/**
 * 
 * @param {*} currentTime 
 */
function getExecutionTime(currentTime) {
  let seconds = Date.now();
  return seconds - currentTime;
}

/**
 * 
 * @param {Date (yyy-mm-dd)} date 
 * @param {machine id} machine 
 * @param {kpi key} kpiKey 
 * @param {set keyObject function } setKeyObject 
 */
function setKpi(date, machine, kpiKey, setKeyObject) {
  if (date && machine && kpiKey) {
    if (inMemoryStoreKpi[date] === undefined) {
      inMemoryStoreKpi[date] = {}
    }
    if (inMemoryStoreKpi[date][machine] === undefined) {
      inMemoryStoreKpi[date][machine] = {};
    }
    inMemoryStoreKpi[date][machine][kpiKey] = setKeyObject || {};
  }
}

/**
 * 
 * @param {Current epocTime} epochTime 
 * @param {Current epocTime Diff} value 
 * @param {previous epocTime} oldEpochTime 
 * @param {previous epocTime Diff} oldValue 
 */
function setKeyObject(epochTime, value, oldEpochTime, oldValue) {
  let obj = {};
  if (epochTime && value) {
    obj = {
      "epochTime": epochTime,
      "value": value
    }
  }
  if (oldEpochTime) obj.oldEpochTime = oldEpochTime;
  if (oldValue) obj.epochTime = epochTime;
  return JSON.stringify(obj);
}

function getKpi(date, machine, key) {
  return inMemoryStoreKpi[date][machine][key];
}

function filterKeyValue(objects, key, value) {
  let obj = null;
  logger.debug(`fn:filterKeyValue object:${key}:${value}`);
  if (objects && key && value) {
    obj = objects.filter((object) => {
      return object[key] == value;

    });
    if (obj.length > 0) {
      obj = obj[0];
      logger.debug(`fn:filterKeyValue object:${JSON.stringify(obj)}`);
      return obj;
    } else {
      logger.debug(`fn:filterKeyValue object:null`);
      return obj;
    }
  } else {
    logger.warn(`fn:filterKeyValue object:${JSON.stringify(obj)}`);
    return obj;
  }
}


/**
 * Returns the sum of all the elements present in array.
 * If array contains other than numbers, then function will return 0.
 * @param {*} numbersArr 
 */
function calculateSumFromArray(numbersArr) {
  try {
    let sum = numbersArr.map(Number).reduce((a, b) => {
      return a + b;
    });
    if (isNaN(sum)) {
      logger.error(`fn:calculateSumFromArray numbers:${numbersArr} message:"Invalid data in array"`);
      return 0;
    } else return sum;
  } catch (err) {
    logger.error(`fn:calculateSumFromArray numbers:${numbersArr} message:"Error while adding numbers" error:${JSON.stringify(err)}"`);
    return 0;
  }
}

/**
 * Returns the average else return null if any issues.
 * @param {*} dividend 
 * @param {*} divisor 
 */
function calculateAverage(dividend, divisor) {
  try {
    if (dividend > 0 && divisor > 0 && dividend > divisor) {
      let avgValue = Math.round(dividend / divisor);
      if (avgValue > 0) return avgValue;
      else return null;
    } else {
      return null;
    }
  } catch (error) {
    logger.error(`fn:calculateAverage dividend:${dividend} divisor:${divisor} message:"Error while adding two executing function" error:${JSON.stringify(error)}"`);
    return null;
  }
}

/**
 * Convert Celsius to Fahrenheit
 * @param {*} value_celsius 
 */
function convertCelsiusToFahrenheit(value_celsius) {
  if (value_celsius) return Math.round(value_celsius * 1.8 + 32);
  else return null;
}


/**
 * Convert Litre to Gallon
 * @param {*} val_litre 
 */
function litreGallon(val_litre) {
  if (typeof val_litre == "string") {
    val_litre = Number(val_litre);
  }
  if (val_litre == 0) return 0;
  if (val_litre > 0) return toFixed(val_litre / 3.785, 2);
  else return null;
}



/**
 * 
 * @param {*} epocTime 
 */
function dateTime(epocTime, machineId) {
  return new Promise((resolve, reject) => {
    epoc_time(epocTime, machineId, (err, res) => {
      if (err) reject(err);
      if (res) {
        resolve(new Date(0)).setUTCSeconds(res);
      } else reject(null);
    })
  })
}

/**
 * 
 * @param {*} value 
 * @param {*} decimalPlaces 
 */

function toFixed(value, decimalPlaces) {

  try {
    if (isEmpty(value) && isEmpty(decimalPlaces))
      return Number(value.toFixed(decimalPlaces));
    return null
  } catch (e) {
    return null;
  }
}

function isEmpty(value) {
  return (value != null || value != undefined);
}