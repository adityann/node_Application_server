const express = require("express");
const router = express.Router();

const thresholdDetails = require('../../controller/api/alarmThreshold')

router.get('/alarm-thresholdLimit/:macId', thresholdDetails.alarmThresholdDetails);
router.post('/alarm-editThresholdLimit',thresholdDetails.editAlarmThresholdDetails)

module.exports = router;