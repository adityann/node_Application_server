var kpi = {}
var inMemoryStoreKpi = {};

for (i = 1; i <= 12; i++) {

  if (kpi["a" + i] === undefined) {
    kpi["a" + i] = {}
  }
  kpi["a" + i]["m" + 1] = '1-' + i;
  kpi["a" + i]["m" + 2] = '2-' + i
  setKpi('2018-12-' + i, 'mid' + i, 'rinse', keyObject(12345678, 12345679, 10))
}


function setKpi(date, machine, key, object) {
  if (date && machine && key) {
    if (inMemoryStoreKpi[date] === undefined) {
      inMemoryStoreKpi[date] = {}
    }
    if (inMemoryStoreKpi[date][machine] === undefined) {
      inMemoryStoreKpi[date][machine] = {};
    }
    inMemoryStoreKpi[date][machine][key] = object || {};
  }
}

console.log(inMemoryStoreKpi)

function keyObject(epochTime, value, oldEpochTime, oldValue) {
  let obj = {};
  if (epochTime && value) {
    obj = {
      "epochTime": epochTime,
      "value": value
    }
  }
  if (oldEpochTime) obj.oldEpochTime = oldEpochTime;
  if (oldValue) obj.epochTime = epochTime;
  return obj;
}

setTimeout(() => console.log(getKpi("2018-12-1", "mid1", "wash")), 1000)

function getKpi(date, machine, key) {
  return inMemoryStoreKpi[date][machine][key]
}