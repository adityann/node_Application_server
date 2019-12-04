const tryCatch = require('./tryCatch');
const config = require("../config/config");
const pacUrl = config.pac_url || process.env.PAC_ROOT_URL;
const apiResponse = require('../util/lib/apiResponse');
const request = require('request');
const logger = require('../startup/logger')

// Validate api for each request
exports.validateToken = tryCatch(async (req, res, next) => {
    if (req.headers.authorization) {
        let options = {
            method: 'GET',
            url: pacUrl + 'auth/validate',
            headers: {
                Authorization: req.headers.authorization
            }
        };

        request(options, function (error, response, body) {
            if (error) next(error);
            logger.info("printing the response from pac" + response)
            if (response.statusCode === 200) {
                next();
            } else {
                res.status(400).json(apiResponse.response("fail", 1200, "Token error or Token expired"));
            }
        });
    } else {
        res.status(400).json(apiResponse.response("fail", 1200, "Authorization Token not provided!"));
    }
});