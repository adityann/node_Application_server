"use strict"

const cassandra_con = require("../../util/db/cassandra/cassandra_client");
const mysql_con = require("../../util/db/mysql/mysql_client");
const mysql_ddl = require("../../util/db/mysql/mysql_ddl");

const cassandra_ddl = require("../../util/db/cassandra/cassandra_ddl");
const logger = require('../../startup/logger');
const myUtils = require('../../util/utils');
const tryCatch = require('../../middeleware/tryCatch');
const apiResponse = require('../../util/lib/apiResponse');

exports.sendDispenserModules = tryCatch(async (req, res, next) => {
    let machine_id = req.params.macID;
    if (machine_id) {
        let getDispenserModules = new Promise(function (resolve, reject) {
            mysql_con.executeQueryParams(mysql_ddl.select.getDispenserModules, machine_id, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    //dispenser_module_name
                    let res = [];
                    if (rows) {
                        for (let row of rows) {
                            res.push(Object.values(row)[0]);
                        }
                    }
                    resolve({
                        "dispenser_module": res
                    });
                }
            });
        });
        getDispenserModules.then(function (dbResponse) {
            res.status(200);
            res.send(apiResponse.response('success', 200, '', dbResponse));
        }).catch(function (e) {
            next(e)
        });
    } else {
        res.status(400);
        res.send(apiResponse.response('error', 400, "Machine Id is required"));
    }
})

exports.sendLiveDetails = tryCatch(async (req, res, next) => {
    //let userName = req.body.handlerData.userEmail.trim();
    let userEmail = req.body.handlerData.userEmail.trim();
    if (userEmail) {
        var socketResponse = socketIO.addUser(userEmail)
        res.json(socketResponse);
    }

})

exports.sendLiveData = tryCatch(async (req, res, next) => {
    let machine_id = req.params.macID;
    if (machine_id) {
        let getLastTimeStamp = new Promise(function (resolve, reject) {
            cassandra_con.db_Select(cassandra_ddl.select.getLasInserted_plexusData, [machine_id], (err, response) => {
                if (err) {
                    //    logger.error(`getLastTimeStamp :: ${JSON.stringify(err)}`);
                    reject(err);
                } else {
                    // logger.debug(`methord:LiveData ::${JSON.stringify(response.rows)}`)
                    // // if (response.rows.length > 0) {
                    // //     if (response.rows[0].c3m_conductivity_bu || response.rows[0].c3m_conductivity_bu_flag) {
                    // //         response.rows[0].detergent_concentration = response.rows[0].c3m_conductivity_bu
                    // //         response.rows[0].detergent_concentration_status = response.rows[0].c3m_conductivity_bu_flag
                    // //     }
                    // }
                    resolve(response.rows[0]);
                }
            })
        });
        getLastTimeStamp.then(function (getLastTimeStampResponse) {
            // send epoc time from 
            if (getLastTimeStampResponse) {
                let date = myUtils.epoch_date(getLastTimeStampResponse.last_time_stamp, machine_id);
                let getMachineKpiMachineId = new Promise(function (resolve, reject) {
                    cassandra_con.db_Select(cassandra_ddl.select.getTrigger_by_machineID, [machine_id, date], (err, response) => {
                        if (err) {
                            reject(err);
                        } else {
                            var kpiKey = {};
                            response.rows.forEach(row => {
                                kpiKey[row.kpi] = row.value;
                            });
                            logger.debug("sendLiveData: kpiKey" + JSON.stringify(kpiKey));
                            resolve(kpiKey);
                        }
                    });
                })
                getMachineKpiMachineId.then(function (getMachineKpiMachineIdResponse) {
                    if (getMachineKpiMachineIdResponse) {
                        const objectResponse = Object.assign({
                            date: date
                        }, getLastTimeStampResponse, getMachineKpiMachineIdResponse)

                        logger.debug(`getTrigger_by_machineID :${JSON.stringify(objectResponse)}`);
                        //   var objectResponse = response[0].concat(response[1]);
                        res.status(200);
                        res.send(apiResponse.response('success', 200, '', objectResponse));
                    } else {
                        res.status(200);
                        res.send(apiResponse.response('success', 200, '', getLastTimeStampResponse));
                    }
                }).catch(function (err) {
                    next(err);
                });
            } else {
                res.status(200);
                let message = `No record Found macId-${machine_id}`;
                res.send(apiResponse.response('success', 200, message));
            }
        }).catch(function (e) {
            next(e)
        })

    } else {
        res.status(400);
        let message = "Machine Id is required";
        res.send(apiResponse.response('error', 400, message));
    }
});