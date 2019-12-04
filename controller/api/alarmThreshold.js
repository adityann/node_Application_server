
const tryCatch = require('../../middeleware/tryCatch');
const logger = require('../../startup/logger');
const myUtils = require('../../util/utils');
const apiResponse = require('../../util/lib/apiResponse');
const initData = require('../../startup/init');
const mysql_con = require("../../util/db/mysql/mysql_client");
const mysqlQuery = require("../../util/db/mysql/mysql_ddl");
const Joi = require('joi');

const schema = Joi.object().keys({
    machineId: Joi.string().alphanum().min(3).max(30).required(),
    default_min: Joi.number().min(0).max(100),
    default_max: Joi.number().min(Joi.ref('default_min')).max(100),
    adjusted_min: Joi.number().min(0).max(100),
    adjusted_max: Joi.number().min(Joi.ref('adjusted_min')).min(Joi.ref('default_max')).max(100),
    adjusted_value: Joi.number().min(0).max(1),
    alarm_type: Joi.string().required()
});

const hygieneThreshold = {
    preWashTempMin: 0,
    preWashTempMax: 0,
    washTempMin: 0,
    washTempMax: 0,
    rinseTempMin: 0,
    rinseTempMax: 0,
    detergentConcMin: 0,
    detergentConcMax: 0,
    avgRinseWaterFlowRateMin: 0,
    avgRinseWaterFlowRateMax: 0
};
const alertThreshold = {
    preWashTempMin: 0,
    preWashTempMax: 0,
    washTempMin: 0,
    washTempMax: 0,
    rinseTempMin: 0,
    rinseTempMax: 0,
    detergentConcMin: 0,
    detergentConcMax: 0,
    avgRinseWaterFlowRateMin: 0,
    avgRinseWaterFlowRateMax: 0
};
const adjustedValue = {
    preWashTemp: 0,
    washTemp: 0,
    rinseTemp: 0,
    detergentConc: 0,
    avgRinseWaterFlowRate: 0
}


exports.alarmThresholdDetails = tryCatch(async (req, res, next) => {
    let machineId = req.params.macId;
    //let checkBox = req.params.checkBox;
    if (machineId) {

        const alaramThreshhold = myUtils.filterByMultipleKeysValues(initData.alarmthreshholdTempList, {
            'machine_system_id': machineId,
            'alarm_type': 'Pre Wash Temperature,Wash Temperature,Rinse Temperature,Avg. Rinse Water Flow Rate,Detergent Concentration'
        });

        alaramThreshhold.forEach(element => {
            if (element.alarm_type == "Pre Wash Temperature") {
                hygieneThreshold.preWashTempMin = element.default_min_value;
                hygieneThreshold.preWashTempMax = element.default_max_value;
                alertThreshold.preWashTempMin = element.adjusted_min_value;
                alertThreshold.preWashTempMax = element.adjusted_max_value;
                adjustedValue.preWashTemp = element.adjusted_value_used;
            }
            if (element.alarm_type == 'Wash Temperature') {
                hygieneThreshold.washTempMin = element.default_min_value;
                hygieneThreshold.washTempMax = element.default_max_value;
                alertThreshold.washTempMin = element.adjusted_min_value;
                alertThreshold.washTempMax = element.adjusted_max_value;
                adjustedValue.washTemp = element.adjusted_value_used;
            }
            if (element.alarm_type == 'Rinse Temperature') {
                hygieneThreshold.rinseTempMin = element.default_min_value;
                hygieneThreshold.rinseTempMax = element.default_max_value;
                alertThreshold.rinseTempMin = element.adjusted_min_value;
                alertThreshold.rinseTempMax = element.adjusted_max_value;
                adjustedValue.rinseTemp = element.adjusted_value_used;
            }
            if (element.alarm_type == 'Detergent Concentration') {
                hygieneThreshold.detergentConcMin = element.default_min_value;
                hygieneThreshold.detergentConcMax = element.default_max_value;
                alertThreshold.detergentConcMin = element.adjusted_min_value;
                alertThreshold.detergentConcMax = element.adjusted_max_value;
                adjustedValue.detergentConc = element.adjusted_value_used;
            }
            if (element.alarm_type == 'Avg. Rinse Water Flow Rate') {
                hygieneThreshold.avgRinseWaterFlowRateMin = element.default_min_value;
                hygieneThreshold.detergentConcMax = element.default_max_value;
                alertThreshold.avgRinseWaterFlowRateMin = element.adjusted_min_value;
                alertThreshold.avgRinseWaterFlowRateMax = element.adjusted_max_value;
                adjustedValue.avgRinseWaterFlowRate = element.adjusted_value_used;
            }

        });

        if (alaramThreshhold.length > 0) {
            res.status(200);
            res.send(apiResponse.response('success', 200, '', [{ "hygiene": hygieneThreshold }, { "alert": alertThreshold }, { "adjustedValueUsed": adjustedValue }]));

        } else {
            res.status(400);
            res.send(apiResponse.response('error', 404, "Not found"));
        }

    } else {
        res.status(400);
        res.send(apiResponse.response('error', 400, "Machine Id is required"));
    }
});


exports.editAlarmThresholdDetails = tryCatch(async (req, res, next) => {

    let body = req.body;
    let machineId = req.body.macId;
    let alarmType = req.body.alarmType;
    let alarmList = Object.keys(alarmType);
    let promiseFunction = [];
    alarmList.forEach((element) => {
        let payload = {
            default_min: body.alarmType[element].default_min,
            default_max: body.alarmType[element].default_max,
            adjusted_min: body.alarmType[element].adjusted_min,
            adjusted_max: body.alarmType[element].adjusted_min,
            adjusted_value: body.alarmType[element].adjusted_value,
            machineId: body.macId,
            alarm_type: element

        }
        const validate = Joi.validate(payload, schema);
        if (!validate.error) {
            let query = mysqlQuery.update.updateAlaramThreshold;
            let params = Object.values(payload).toString();
            let pro = new Promise((resolve, reject) => {
                mysql_con.executeQueryParams(query, params, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve("sucess")
                    }
                })
            });
            promiseFunction.push(pro);
        } else {
            res.status(400);
            res.send(apiResponse.response('error', 400, validate.error.details[0].message));
        }

    });


    Promise.all(promiseFunction).then((response) => {
        // if (err) {
        //     res.status(400);
        //     res.send(apiResponse.response('error', 400, "db not updated"));
        // } else {
        res.status(200);
        res.send(apiResponse.response('success', 200));

    })

}); 
