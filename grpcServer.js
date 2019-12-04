'use strict';

require('dotenv').config({
    silent: true
});
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const logger = require('./startup/logger');

const PROTO_PATH = __dirname + '/startup/grpc/protos/messageLis.proto';

const port = process.env.grpcPort;
const host = (process.env.grpcHostLocal || process.env.grpcHost) + ':' + port;

// add the events package
const events = require('events');
process.setMaxListeners(Infinity);

// aevent Emitter
const eventEmitter = new events.EventEmitter();
// Suggested options for similarity to existing grpc.load behavior
const options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
}

const packageDefinition = protoLoader.loadSync(PROTO_PATH, options);

var message_proto = grpc.loadPackageDefinition(packageDefinition).mqttMessage;

var server = new grpc.Server();

function main() {
    server.addService(
        message_proto.MqttMessageEmitter.service, {
            sayWelcome: sayWelcome,
            setPlexusData: setPlexusData,
            setSnapShotData: setSnapShotData,
            watchPlexusData: watchPlexusData,
            watchSnapShotData: watchSnapShotData
        });
    server.bind(host, grpc.ServerCredentials.createInsecure());
    logger.info("Server gRPC up at " + host);
    server.start();
}
module.exports.rpc_start = main();

/***************************************************************/

function sayWelcome(call, callback) {
    callback(null, {
        message: call.request.name
    });
}


/********************* Plexus Data  ************************** */
var plexusDataCount = 0;
var watchPlexusDataCount = 0;
var snapShotDataCount = 0;
var watchsnapShotDataCount = 0;
// setting plexus-Data  method
function setPlexusData(call, callback) {
    var updateMessage = call.request;
    logger.debug(`set plexusData::-"${++plexusDataCount}"`);
    eventEmitter.emit('plaxexData', updateMessage);
    callback(null, {});
}

// watcing method plexusData  
function watchPlexusData(stream) {
    eventEmitter.on('plaxexData', function (PlaxexData) {
        logger.debug(`send plaxexData::-"${++watchPlexusDataCount}"`);
        stream.write(PlaxexData);
    });
}
/********************* SnapShot Data  ************************** */
// set  snap-Shot-Data  
function setSnapShotData(call, callback) {
    var setSnapShot = call.request;
    logger.debug(`set snapShotData::-"${++snapShotDataCount}"`);
    eventEmitter.emit('snapShotData', setSnapShot);
    callback(null, {});
}

// watch method snap-Shot-Data  
function watchSnapShotData(stream) {
    eventEmitter.on('snapShotData', function (snapShot) {
        logger.debug(`send snapShot::-"${++watchsnapShotDataCount}"`)
        stream.write(snapShot);
    });
}


process.on('warning', (warning) => logger.warn(`GRPC-warning:${warning}`));
process.on('unhandledRejection', (reason, p) => {
    logger.error(`GRPC-unhandledRejection, reason:${reason} Error:${JSON.stringify(p)}`)
    process.kill(process.pid);
});
process.on('uncaughtException', err => {
    logger.error(`GRPC -uncaughtException code:${err.code} details:${err.details} trace:${JSON.stringify(err)}`);
    // Close current server
    process.exit(1);
    process.kill(process.pid);

});

process.on('exit', function (code) {
    logger.error(`GRPC server stoped processId:${process.pid} code:${code} processUpTime:${process.uptime()}`);
    //   process.kill(process.pid)
    process.exit(code);
});

//if (env == 'development') {
process.on('SIGINT', (err) => { // Handle CTRL+C
    logger.error(`SIGINT-GRPC, error:${JSON.stringify(err)}`);
    // process.kill(process.pid)
    // process.exit(0);
});