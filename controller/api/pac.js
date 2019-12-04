const request = require('request');
const hardcodedResponse = require('../../util/hardcodedResponse');
const conn = require('../../util/db/mysql/mysql_client');
const query = require("../../util/db/mysql/mysql_ddl");
const config = require("../../config/config");
const logger = require('../../startup/logger');
const util = require('../../util/utils');
const dblist = require("../../startup/init");
const tryCatch = require('../../middeleware/tryCatch');
const apiResponse = require('../../util/lib/apiResponse');
const pacUrl = config.pac_url || process.env.PAC_ROOT_URL;
const intellidishLivePageUrl = process.env.Intellidish_live_page_url || config.Intellidish_live_page_url;


exports.solutionOverview = tryCatch((req, res, next) => {
    if (req.body) {
        logger.info(`solutionOverview Api Dis: API request body , Body:${JSON.stringify(req.body)}`)
        /**
         * for the time bieng hardcoded value is sended to the api response 
         */
        let resObject = {
            "icon": "empty",
            "colour": "blue",
            "redirectTo": intellidishLivePageUrl
        }
        res.send({
            "status": "success",
            "code": "200",
            "data": resObject
        })
    } else {
        res.status(400).json(apiResponse.response("fail", "Invalid Api Payload!!!!", 400));
    }

})

exports.hierarchy = tryCatch((req, res, next) => {

    try {
        // resp = JSON.parse(body);
        // if (resp.success) {
        let newOptions = {
            method: 'GET',
            url: pacUrl + 'hierarchy',
            headers: {
                Authorization: req.headers.authorization
            }
        }
        request(newOptions, (error, response, body) => {
            if (error) next(error);
            if (res.statusCode === 200) {
                res.send(hardcodedResponse)
            } else {
                res.send(res.statusCode)
            }
        })

    } catch (e) {
        next(e);
    }

})


exports.user = tryCatch((req, res, next) => {
    try {
        let newOptions = {
            method: 'GET',
            url: pacUrl + 'user',
            headers: {
                Authorization: req.headers.authorization
            }
        }
        request(newOptions, (error, response, body) => {
            if (error) {
                next(error);
            } else if (response.statusCode === 200) {
                var result = JSON.parse(body);
                let params = result.data.role;
                conn.executeQueryParams(query.select.getRole, params, (err, rows) => {
                    if (err) {
                        logger.error(`fn:getUser.executeQueryParams error:${JSON.stringify(err)}`)
                        next(err)
                    } else if (rows.length > 1) {
                        result.data.intellidish_role = rows[0];
                        console.log("actual res 1:" + JSON.stringify(result))
                        res.send(result)

                    } else {
                        result.data.intellidish_role = {};
                        res.send(result)
                    }
                });
            } else {
                res.status(400).json(apiResponse.response("fail", "Invalid Api Payload!!!!", 400));
            }
        })

    } catch (e) {
        next(e);
    }

});



exports.machineDetails = tryCatch((req, res, next) => {

    if (req.body) {
        let id = Object.values(req.body)
        let params = ''
        for (let count = 0; count < id.length; count++) {
            params += id[count] + ','
        }
        conn.executeQueryParams(query.select.byID_Name, params, (err, response) => {
            if (response) {
                let count = 0;
                while (count in Object.keys(response)) {
                    response[count].time_zone = util.timezone(response[count].time_zone)
                    count += 1
                }
                res.send(response)
            } else {
                logger.error(`fn:getRegion.executeQueryParams error:${JSON.stringify(err)}`)
                next(err)
            }
        });

    } else {
        res.status(400).json(apiResponse.response("fail", "Invalid Api Payload!!!!", 400));
    }


});


exports.organisation = tryCatch((req, res, next) => {
   
    if (dblist.organisationName) {
        res.send({
            status: 'success',
            result: dblist.organisationName
        });
    } else {
        res.status(400).json(apiResponse.response("fail", "Invalid Api Payload!!!!", 400));
    }
   
});

exports.getRegion = tryCatch((req, res, next) => {

    if (req.body.id) {
        conn.executeQueryParams(query.select.getRegionName, req.body.id, (err, response) => {
            if (response) {
                res.send(response)
            } else {
                logger.error(`fn:getRegion.executeQueryParams error:${JSON.stringify(err)}`)
                next(err);
            }
        });
    } else {
        res.status(400).json(apiResponse.response("fail", "Invalid Api Payload!!!!", 400));
    }
  
});

exports.getCountry = tryCatch((req, res, next) => {

    if (req.body.id && req.body.region) {
        let param = req.body.id + "," + req.body.region;

        conn.executeQueryParams(query.select.getCountryName, param, (err, response) => {
            if (response) {
                res.send(response)
            } else {
                logger.error(`fn:getRegion.executeQueryParams error:${JSON.stringify(err)}`);
                next(err)
            }
        })
    } else {
        res.status(400).json(apiResponse.response("fail", "Invalid Api Payload!!!!", 400));
    }
  
});

exports.getCity = tryCatch((req, res, next) => {
 
    if (req.body.id && req.body.region && req.body.country) {
        let param = req.body.id + "," + req.body.region + "," + req.body.country;
        conn.executeQueryParams(query.select.getCityName, param, (err, response) => {
            if (response) {
                res.send(response);
            } else {
                logger.error(`fn:getRegion.executeQueryParams error:${JSON.stringify(err)}`);
                next(err)
            }
        });
    } else {
        res.status(400).json(apiResponse.response("fail", "Invalid Api Payload!!!!", 400));
    }
   
});

exports.getSite = tryCatch((req, res, next) => {
    
    if (req.body.id && req.body.region && req.body.country && req.body.city) {
        let param = req.body.id + "," + req.body.region + "," + req.body.country + "," + req.body.city;
        conn.executeQueryParams(query.select.getSiteName, param, (err, response) => {
            if (response) {
                res.send(response)
            } else {
                logger.error(`fn:getRegion.executeQueryParams error:${JSON.stringify(err)}`);
                next(err);
            }
        })
    } else {
        res.status(400).json(apiResponse.response("fail", "Invalid Api Payload!!!!", 400));
    }
    
});


exports.getUnitMeasures = tryCatch(async (req, res, next) => {
   
    if (req.body.locale) {
        conn.executeQueryParams(query.select.getLocaleMetaData, req.body.locale, (err, response) => {
            if (err) {
                next(err)
            } else if (response) {
                res.status(200);
                if (response.length == 0) {
                    response.push({
                        "locale": "English - United States",
                        "language_code": "en",
                        "date_format": "dd mmm yyyy",
                        "time_format": "HH:mm:ss",
                        "temperature": "C",
                        "currency": "€",
                        "number_format": "1.000,00",
                        "mass_unit": "kg / g",
                        "length_unit": "km / m",
                        "area_unit": "m^2",
                        "volume_unit": "L",
                        "electrical_energy_unit": "kWh"
                    });
                }
                res.send(apiResponse.response("success", '', 200, response))
            } else {
                res.status(404);
                res.send(apiResponse.response("success", "No Data Found", 404, {}))
            }
        })
    } else {
        res.status(400);
        res.send(apiResponse("fail", "Invalid Body", 400))
    }

});
