const express = require("express");
const router = express.Router();
const settingsController = require('../../controller/api/setting');

/**
 * @swagger
 * /alert-setting-global:
 *   get:
 *     tags:
 *       - /alert-setting-global
 *     description: Get global alert filter settings
 *     produces:
 *       - application/json   
 *     responses:
 *       200:
 *         description: Global alert filter settings
 *         schema:
 *           {}
 */
router.get('/alert-setting-global', settingsController.getGlobalAlert);

/**
 * @swagger
 * /alert-setting-global:
 *   get:
 *     tags:
 *       - /alert-setting-global
 *     description: Update global alert filter settings
 *     produces:
 *       - application/json   
 *     responses:
 *       200:
 *         description: Global alert filter settings
 *         schema:
 *           {}
 */
router.post('/alert-setting-global', settingsController.postGlobalAlert);

/**
 * @swagger
 * /alert-setting/:macId:
 *   get:
 *     tags:
 *       - /alert-setting/:macId
 *     description: Get alert filter settings
 *     produces:
 *       - application/json   
 *     responses:
 *       200:
 *         description: Alert filter settings
 *         schema:
 *           {}
 */
router.get('/alert-setting/:macId', settingsController.getAlert);

/**
 * @swagger
 * /alert-setting:
 *   get:
 *     tags:
 *       - /alert-setting
 *     description: Update alert filter settings
 *     produces:
 *       - application/json   
 *     responses:
 *       200:
 *         description: Alert filter settings
 *         schema:
 *           {}
 */
router.post('/alert-setting', settingsController.postAlert);

module.exports = router;