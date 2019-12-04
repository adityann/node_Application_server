"use strict"

const tryCatch = require('../../middeleware/tryCatch');
const conn = require('../../util/db/mysql/mysql_client');
const query = require("../../util/db/mysql/mysql_ddl");
const apiResponse = require('../../util/lib/apiResponse');
const Joi = require('joi');
const logger = require('../../startup/logger');

const globalAlertSchema = Joi.object().keys({
    count_set: Joi.number().integer().min(0).max(65535).required(),
    count_clear: Joi.number().integer().min(0).max(65535).required(),
    alert: Joi.string().required(),
    last_modified_by: Joi.string().allow('').required()
});

const alertSchema = Joi.object().keys({
    count_set: Joi.number().integer().min(0).max(65535).required(),
    count_clear: Joi.number().integer().min(0).max(65535).required(),
    alert: Joi.string().required(),
    last_modified_by: Joi.string().allow('').required(),
    machine_id: Joi.string().alphanum().min(3).max(30).required(),
    onboarding: Joi.bool().required()
});

/**
 * Retreive Global alert filter setting details from DB. (MySql)
 * Table - alert_filter__global
 */
exports.getGlobalAlert = tryCatch(async (req, res, next) => {
    conn.executeQuery(query.select.getAlertSettingGlobal, (err, response) => {
        if (err) {
            next(err)
        } else {
            if (response) {
                res.status(200);
                res.send(apiResponse.response("success", 200, '', response))
            } else {
                res.status(404);
                res.send(apiResponse.response("success", 404, "No Data Found"))
            }
        }
    })
});

/**
 * Update the Global alert setting details in DB. (MySql)
 * Table - alert_filter__global_settings
 */
exports.postGlobalAlert = tryCatch(async (req, res, next) => {
    let updateQueries = [];
    req.body.data.forEach(element => {
        let settingParam = {
            count_set: element.wash_cycle_count_set,
            count_clear: element.wash_cycle_count_clear,
            alert: element.alert,
            last_modified_by: req.body.last_modified_by
        }
        let validate = Joi.validate(settingParam, globalAlertSchema);
        let params = '';
        if (!validate.error) {
            params = [settingParam.count_set, settingParam.count_clear, settingParam.last_modified_by, settingParam.alert];
            updateQueries.push(conn.executeQuery_Promise(query.update.alertFilterGlobal, params));
        } else {
            logger.error(`fn:postGlobalAlert params:${params} message:${validate.error.details[0].message}`);
            res.status(400);
            res.send(apiResponse.response("fail", 400, validate.error.details[0].message))
        }
    });

    Promise.all(updateQueries).then(() => {
        res.status(205);
        res.send(apiResponse.response("success", 205));
    }).catch((err) => {
        next(err);
    })
});


/**
 * Retreive Alert filter setting details from DB. (MySql)
 * Table - alert_filter_settings
 */
exports.getAlert = tryCatch(async (req, res, next) => {
    let macId = req.params.macId;
    if (macId) {
        conn.executeQueryParams(query.select.getAlertSetting, macId, (err, response) => {
            if (err) {
                next(err)
            } else if (response) {
                res.status(200);
                res.send(apiResponse.response("success", 200, '', response))
            } else {
                res.status(404);
                res.send(apiResponse.response("success", 404, "No Data Found"))
            }
        })
    } else {
        res.status(400);
        res.send(apiResponse.response("fail", 400, "MacId Required"))
    }
});

/**
 * Update the Alert setting details in DB. (MySql)
 * Table - alert_filter_
 */
exports.postAlert = tryCatch(async (req, res, next) => {
    let queries = [];
    let status = 200;

    req.body.data.forEach(element => {
        let settingParam = {
            count_set: element.wash_cycle_count_set,
            count_clear: element.wash_cycle_count_clear,
            alert: element.alert,
            last_modified_by: req.body.last_modified_by,
            machine_id: req.body.machine_id,
            onboarding: req.body.onboarding
        }
        let validate = Joi.validate(settingParam, alertSchema);
        let params = '';
        if (!validate.error) {
            params = [settingParam.count_set, settingParam.count_clear, settingParam.last_modified_by, settingParam.alert, settingParam.machine_id];
            if (settingParam.onboarding == true) {
                status = 201;
                queries.push(conn.executeQuery_Promise(query.insert.alertFilter, params));
            } else {
                status = 205;
                queries.push(conn.executeQuery_Promise(query.update.alertFilter, params));
            }
        } else {
            logger.error(`fn:postAlert params:${params} message:${validate.error.details[0].message}`);
            res.status(400);
            res.send(apiResponse.response("fail", 400, validate.error.details[0].message))
        }
    });

    Promise.all(queries).then(() => {
        res.status(status);
        res.send(apiResponse.response("success", status));
    }).catch((err) => {
        next(err);
    })
});

