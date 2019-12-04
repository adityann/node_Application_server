const cassandra_ddl = require("../../util/db/cassandra/cassandra_ddl");
const cassandra_client = require("../../util/db/cassandra/cassandra_client");
const tryCatch = require('../../middeleware/tryCatch');
const apiResponse = require('../../util/lib/apiResponse');
const Joi = require('joi');

const schema = Joi.object().keys({
    macId: Joi.string().alphanum().min(3).max(30).required(),
    from: Joi.date().required(),
    to: Joi.date().min(Joi.ref('from')).required()
});

exports.getAlerts = tryCatch(async (req, res, next) => {
    let body = req.body;
    let payload = {
        macId: body.macId,
        from: body.from,
        to: body.to
    }
    // Return result.
    const validate = Joi.validate(payload, schema);

    if (!validate.error) {
        let query = cassandra_ddl.select.getAlertsHistory;
        let params = [payload.macId, payload.from + '.000+0000', payload.to + '.000+0000'];
        cassandra_client.db_Select(query, params, (err, dbResponse) => {
            if (err) {
                next(err)
            } else {              
                res.status(200);
                res.send(apiResponse.response('success', 200, '', dbResponse.rows));
            }
        })
    } else {
        res.status(400);
        res.send(apiResponse.response('error', 400, validate.error.details[0].message));
    }
});
