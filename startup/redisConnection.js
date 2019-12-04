const logger = require('./logger')

const redis = require('redis');

const host = process.env.redisHost;
const port = process.env.redisPort;

const client = redis.createClient(port, host);


client.on("error", function (err) {
    if (err) {
        logger.error(`"Error in redis Connection" ${host}:${port}`);
    } else {
        logger.info(`"Redis" connected to ${host}:${port}`);
    }
});

module.exports = client;