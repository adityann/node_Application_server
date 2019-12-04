const express = require("express");
const router = express.Router();
const alerts = require("./../../controller/api/alerts");

router.get('/alerts', alerts.getAlerts);
module.exports = router;