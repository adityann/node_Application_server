const redisClient = require('./redisConnection');

exports.redisObject = null;

redisClient.keys('2019-02-1[4|3]_*', function (err, keys) {
    if (err) return console.log(err);
    else {
        if (keys.length > 0) {
            redisClient.mget(keys, (err, values) => {
                if (err) {
                    throw err;
                }
                exports.redisObject = Object.assign(...values.map(value => {
                    var mapValue = JSON.parse(value);
                    return {
                        [mapValue.key]: mapValue
                    };
                }))
                //  console.log(Buffer.byteLength(JSON.stringify(exports.redisObject), 'utf8'));
                //  console.log(Object.size(exports.redisObject));
                  console.log(exports.redisObject)
            });
        }
    }
});