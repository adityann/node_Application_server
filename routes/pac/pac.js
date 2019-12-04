const express = require("express");
const router = express.Router();
const pacController = require('../../controller/api/pac');


/**
 * @swagger
 * /hierarchy:
 *   get:
 *     tags:
 *       - Hierarchy
 *     description: Get Hierarchy
 *     produces:
 *       - application/json  
 *     responses:
 *       200:
 *         description: Hierarchy Object
 *         schema:
 *           {}
 */
router.get('/hierarchy', pacController.hierarchy);


/**
 * @swagger
 * /user:
 *   get:
 *     tags:
 *       - Users
 *     description: Returns current logged in user
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User Object
 *         schema:
 *           {}
 */
router.get('/user', pacController.user);

/**
 * @swagger
 * /machinedetails:
 *   post:
 *     tags:
 *       - Machinedetails
 *     description: Get machine details based on site id.
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: body
 *         description: Site object
 *         in: body
 *         required: true
 *         schema:
 *          {}
 *     responses:
 *       200:
 *         description: Successfully received machine details
 */
router.post('/machinedetails', pacController.machineDetails);


/**
 * @swagger
 * /solutionOverview:
 *   post:
 *     tags:
 *       - solutionOverview
 *     description: Get machine details based on site id.
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: body
 *         description: redirection details
 *         in: body
 *         required: true
 *         schema:
 *          {}
 *     responses:
 *       200:
 *         description: Successfully recieved redirection id and details
 */
router.post('/solution-Overview', pacController.solutionOverview);

/**
 * @swagger
 * /organisation-name:
 *   post:
 *     tags:
 *       - organisation-name
 *     description: Ge organistion and client name
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: body
 *         description: redirection details
 *         in: body
 *         required: true
 *         schema:
 *          {}
 *     responses:
 *       200:
 *         description: Successfully recieved redirection id and details
 */
router.get('/organisation-name', pacController.organisation);


router.post('/getRegion',pacController.getRegion);

router.post('/getCountry',pacController.getCountry);

router.post('/getCity',pacController.getCity);

router.post('/getSite',pacController.getSite);

router.post('/getLocaleMetaData',pacController.getUnitMeasures);

module.exports = router;    