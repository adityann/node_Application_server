module.exports = {
    "key": null,
    "machineInfo": {
        "device_type": null,
        "machine_type": null
    },
    "machineId": null,
    "timeStamp": null,
    "syncToken": null,
    "washTrigger": null,
    "rinseTrigger": null,
    "wash": null,
    "rinse": null,
    "washCycle": 0,
    "washTime": 0,
    "rinseTime": 0,
    "isWashFlagWasOn": null,
    "usageEfficiency": null,
    "fillInstalledSensor": null,
    "fillWater": {
        "totalFillWater": 0,
        "waterFillCount": 0,
        "isAllreadyFilled": 0,
        "conductivity": 0,
        "timeStamp": 0,
        "timeDiff": 0,
    },
    "energyConsumption": {
        "energyMeter": null,
        "totalEnergy": 0,
    },
    "rinseCalculation": {
        "washFlag": null,
        "timeDifference": null,
        "totalRinseTime": null,
        "washCycle": null,
        "rinseWaterWashing": 0,
        "rinseWaterFilling": 0,
        "totalRinseWater": 0,
        "sumRinseWater": 0,
        "nominalRinseFlowRate": null,
        "literPerPulse": null,
        "rinseWaterMeter": null,
        "fillWaterMeter": null,
        "WaterMeterPulseCount": 0,
        "fillTrigger": null,
        "avgRinseWaterflowRate": 0,
        "avgRinseFlowRateStatus": '0',
    },
    "washCalculation": {
        "timeDifference": null
    },
    "triggers": {},
    "dbUpdate": {
        "accWashTime": 0,
        "accRinsetime": 0,
        "accUsageEffiency": 0,
        "accWashCycles": 0,
        "accFillWater": 0,
        "accFillCount": 0,
        "accRinseWater": 0,
        "accRinseWaterFilling": 0,
        "accRinseWaterWashing": 0,
        "accEnergyConsumption": 0,
        "hygiene": 0,
        "alert": {
            "washTooLow": 0,
            "washTooHigh": 0,
            "rinseTooLow": 0,
            "rinseTooHigh": 0,
            "conductivityTooLow": 0,
            "conductivityTooHigh": 0,
            "preWashTooLow": 0,
            "preWashTooHigh": 0,
            "avgRinseWaterFlowRate": 0
        }
    },
    "hygiene": {
        "parameters": {
            "cumulativeWashTemp": 0,
            "washTempCount": 0,
            "cumulativeRinseTemp": 0,
            "rinseTempCount": 0,
            "cumulativeDetergentConcentration": 0,
            "detergentConcentrationCount": 0,
            "cumulativePreWashTemp": 0,
            "preWashTempCount": 0
        },
        "average": {
            "washTemp": 0,
            "rinseTemp": 0,
            "detergentC": 0,
            "preWash": 0
        }
    },
    "alarmThreshold": {

    },
    "alerts": {
        "washTooLow": {
            "name": null,
            "id": 0,
            "timeUuid": null,
            "status": "Clear",
            "counter": 0,
            "setCounter": 0,
            "clearCounter": 0,
            "priority": null,
            "issueType": null,
            "thresholdValue": 0
        },
        "washTooHigh": {
            "name": null,
            "id": 0,
            "timeUuid": null,
            "status": "Clear",
            "counter": 0,
            "setCounter": 0,
            "clearCounter": 0,
            "priority": null,
            "issueType": null,
            "thresholdValue": 0
        },
        "rinseTooLow": {
            "name": null,
            "id": 0,
            "timeUuid": null,
            "status": "clear",
            "counter": 0,
            "setCounter": 0,
            "clearCounter": 0,
            "priority": null,
            "issueType": null,
            "thresholdValue": 0
        },
        "rinseTooHigh": {
            "name": null,
            "id": 0,
            "timeUuid": null,
            "status": "clear",
            "counter": 0,
            "setCounter": 0,
            "clearCounter": 0,
            "priority": null,
            "issueType": null,
            "thresholdValue": 0
        },
        "conductivityTooLow": {
            "name": null,
            "id": 0,
            "timeUuid": null,
            "status": "clear",
            "counter": 0,
            "setCounter": 0,
            "clearCounter": 0,
            "priority": null,
            "issueType": null,
            "thresholdValue": 0
        },
        "conductivityTooHigh": {
            "name": null,
            "id": 0,
            "timeUuid": null,
            "status": "clear",
            "counter": 0,
            "setCounter": 0,
            "clearCounter": 0,
            "priority": null,
            "issueType": null,
            "thresholdValue": 0
        },
        "preWashTooLow": {
            "name": null,
            "id": 0,
            "timeUuid": null,
            "status": "clear",
            "counter": 0,
            "setCounter": 0,
            "clearCounter": 0,
            "priority": null,
            "issueType": null,
            "thresholdValue": 0
        },
        "preWashTooHigh": {
            "name": null,
            "id": 0,
            "timeUuid": null,
            "status": "clear",
            "counter": 0,
            "setCounter": 0,
            "clearCounter": 0,
            "priority": null,
            "issueType": null,
            "thresholdValue": 0
        },
        "waterChangeRequired": {
            "name": null,
            "id": 0,
            "timeUuid": null,
            "status": "clear",
            "counter": 0,
            "setCounter": 0,
            "clearCounter": 0,
            "priority": null,
            "issueType": null,
            "thresholdValue": 0
        }
    }

}