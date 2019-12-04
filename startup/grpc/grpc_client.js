const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const logger = require('../../startup/logger');

const PROTO_PATH = path.join(__dirname, './protos/messageLis.proto');

const port = process.env.grpcPort || 5003;
const host = (process.env.grpcHostLocal || process.env.grpcHost || '0.0.0.0') + ':' + port;

const options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
}
const packageDefinition = protoLoader.loadSync(PROTO_PATH, options);

const proto = grpc.loadPackageDefinition(packageDefinition).mqttMessage;
const clientOptions = {
    'grpc.min_reconnect_backoff_ms': 1000,
    'grpc.max_reconnect_backoff_ms': 100000
};
const client = new proto.MqttMessageEmitter(host,
    grpc.credentials.createInsecure(), clientOptions);

try {
    client.sayWelcome({
        name: 'IntelliDishEngine-gRPC !!'
    }, function (error, response) {
        printResponse(error, response);
    });
} catch (e) {
    logger.error(e);
}

// Watching Snap-Shot Data
//const call_watchSnapShotData = client.watchSnapShotData({});

// Watching Plexus Data 
//const watchPlexusData = client.watchPlexusData({});
// call.on('data', function (response) {
//     console.log("watchPlexusData")
//     console.log(JSON.parse(response.triggers));
// });

// call.on('end', function () {
//     // The server has finished sending
//     console.info(" server has finished sending")
// });
// call.on('error', function (e) {
//     console.error("Error\n" + e)
//     // An error has occurred and the stream has been closed.
// });
// call.on('status', function (status) {
//     // process status
//     console.log(status);
// });

logger.info("Client gRPC is up at " + host);

module.exports = client;
//exports.watchPlexusData = watchPlexusData;
//exports.watchSnapShotData = call_watchSnapShotData;

/***************************************************************/
function printResponse(error, response) {
    if (error) {
        logger.error('Error: In gRPC Connection Try Again !!!\t' + error);
        return;
    } else {
        logger.info(`Client-gRPC is up!!!  "${response.message}"`);
    }
}