'use strict';

const logger = require('./logger')
const cassandraDriver = require('cassandra-driver');

const distance = cassandraDriver.types.distance;

const contactPoints = process.env.cassandraHost + ':' + process.env.cassandraPort;

const option = {
    contactPoints: [contactPoints],
    keyspace: process.env.cassandraDatabase,
    //  socketOptions: { readTimeout: 30000 },
    pooling: {
        coreConnectionsPerHost: {
            [distance.local]: 8,
            [distance.remote]: 8
        }
    }
};

const client = new cassandraDriver.Client(option);

client.connect(function (err) {
    if (err) {
        logger.error(`ERROR Cassandra client is Connected to cluster with ${client.hosts.length} host(s): ${client.hosts.keys()}`);
        return;
    } else {
        logger.info(`Cassandra client is Connected to cluster with ${client.hosts.length} host(s): ${client.hosts.keys()}`);
        return;
    }
});



client.on('log', function (level, className, message, furtherInfo) {
    // console.log('DB log event: %s -- %s -- %s', className, level, message);
});

module.exports = client;