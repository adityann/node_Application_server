"use strict";

require('dotenv').config({
  silent: true
});
// require('../stackimpact');

const dash = require('appmetrics-dash');

// load Config File
var config = require('../config/config');

//load on start-up
require('../startup/init');
require('../startup/redisConnection');

const app = require('../app');

/**
 * Get port from environment and store in Express.
 */
const env = app.get('env');

const port = (env == 'development') ? normalizePort(config.app_port) : normalizePort(process.env.appPort);

const nodemon = require('nodemon');
const http = require('http');
const debug = require('debug')('myapp:server');
const util = require('util');
const https = require('https')
const socketIO = require("../util/socketIO").socketApi;
const logger = require('../startup/logger');
const fs = require('fs');
const path = require('path');
const gRPCServer = require("../grpcServer");
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, './security/server.key')),
  cert: fs.readFileSync(path.join(__dirname, './security/server.cert'))
}


const host = process.env.appHost;


app.set('port', port);

process.setMaxListeners(Infinity); // <== Important line


/**
 * Create HTTP server.
 */
const server = http.createServer(app);
const io = socketIO.io.attach(server);

/**
 * monitor application 
 */

dash.monitor({
  title: "IntelliDisk Engine",
  server: server
});





/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, function () {
  gRPCServer.rpc_start
  require("../controller/grpc/watchData");
});
server.on('error', onError);
server.on('listening', onListening);

process.on('warning', (warning) => logger.warn(`warning:${warning}`));
process.on('unhandledRejection', (reason, p) => {

  logger.error(`unhandledRejection, reason:${reason} Error:${JSON.stringify(p)}`);
  // process.kill(process.pid);
});
process.on('uncaughtException', err => {
  logger.error(err)
  logger.error(`uncaughtException code:${err.code} message:${err.details} trace:${JSON.stringify(err)}`);

  if (err.code == 'ECONNREFUSED' || err.code == 14) {
    if (err.code == 14) {
      logger.error("error in gRPC Connection" + err.details);
    }
  }
  // Close current server
  //   process.exit(1);
  //  process.kill(process.pid);

});

process.on('exit', function (code) {
  logger.error(`server stoped processId:${process.pid} code:${code} processUpTime:${process.uptime()} memmoryUsed:${JSON.stringify(util.inspect(process.memoryUsage()))}`);
  //Close current server
  socketIO.io.close();
  // Handle normal exits
  nodemon.emit('quit');
  //   process.kill(process.pid)
  process.exit(code);
});

//if (env == 'development') {
process.on('SIGINT', (err) => { // Handle CTRL+C
  logger.error(`SIGINT, error:${JSON.stringify(err)}`);
  //  socketIO.io.close();
  //   nodemon.emit('quit');
  // process.kill(process.pid)
  // process.exit(0);
});


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }
  if (port >= 0) {
    // port number
    return port;
  }
  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string' ?
    'Pipe ' + port :
    'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {

  var addr = server.address();
  var bind = typeof addr === 'string' ?
    'pipe ' + addr :
    'port ' + addr.port;
  debug('Listening on ' + bind);
  let serverInfo = `Engine running on port:${app.get('port')} enviornment:${env}`;
  logger.info("************SERVER STARTED **********************")
  logger.info(serverInfo);
}