const express = require("express");
const router = express.Router();

const liveData = require('../../controller/api/live-data');
const parmeters = require('../../controller/api/parameters')

/**
 * @swagger
 * /live-data/:macID:
 *   get:
 *     tags:
 *       - /live-data/:macID
 *     description: Get machine details
 *     produces:
 *       - application/json   
 *     responses:
 *       200:
 *         description: Machine details
 *         schema:
 *           {}
 */
router.get('/live-data/:macID', liveData.sendLiveData);

/**
 * @swagger
 * /dispenser-modules/:macID:
 *   get:
 *     tags:
 *       - /dispenser-modules/:macID
 *     description: Get all dispenser modules of machine 
 *     produces:
 *       - application/json   
 *     responses:
 *       200:
 *         description: dispenser modules 
 *         schema:
 *           {}
 */
router.get('/dispenser-modules/:macID', liveData.sendDispenserModules);

/**
 * @swagger
 * /alarm-threshold/:macId:
 *   get:
 *     tags:
 *       - /alarm-threshold/:macId
 *     description: Get all Alarm Thresh Hold of machine 
 *     produces:
 *       - application/json   
 *     responses:
 *       200:
 *         description: dispenser modules 
 *         schema:
 *           {}
 */

router.get('/alarm-threshold/:macId', parmeters.getAlarmThreshHoldByMacId);

/**
 * @swagger
 * /parmeters:
 *   post:
 *     parameters:
 *      - macId: Machine Id
 *        from: From Date
 *        to: To Date
 *        required: true
 *     tags:
 *       - /parmeters
 *     description: Get all parmeters of macId by date range
 *     produces:
 *       - application/json   
 *     responses:
 *       200:
 *         description: Machine details
 *         schema:
 *           {}
 */
router.post('/parmeters', parmeters.getRealTimeByMacId);

/**
 * @swagger
 * /summery:
 *   post:
 *     parameters:
 *      - macId: Machine Id
 *        from: From Date
 *        to: To Date
 *        required: true
 *     tags:
 *       - /summery
 *     description: Get all machine Kpi(summery Page) of macId by date range
 *     produces:
 *       - application/json   
 *     responses:
 *       200:
 *         description: Machine details
 *         schema:
 *           {}
 */
router.post('/summery', parmeters.getSummeryByMacId);

/**
 * @swagger
 * /parameter-hygiene:
 *   post:
 *     parameters:
 *      - macId: Machine Id
 *        from: From Date
 *        to: To Date
 *        required: true
 *     tags:
 *       - /parameter-hygiene
 *     description: Get all parameter hygiene Kpi(Hygiene Page) of macId by date range
 *     produces:
 *       - application/json   
 *     responses:
 *       200:
 *         description: Parameter hygiene details
 *         schema:
 *           {}
 */
router.post('/parameter-hygiene', parmeters.getParameterHygieneByMacId);

/**
 * @swagger
 * /getSensorData/:macId:
 *   get:
 *     tags:
 *       - /getSensorData/:macId
 *     description: Get Sensor data of machine 
 *     produces:
 *       - application/json   
 *     responses:
 *       200:
 *         description: Sensor data 
 *         schema:
 *           {}
 */
router.get('/getMachineData/:macId', parmeters.getSensorDataByMacId);

module.exports = router;