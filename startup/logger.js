'use strict';

const {
    createLogger,
    format,
    transports
} = require('winston');
const {
    combine,
    timestamp,
    label,
    printf
} = format;

const timeFormate = format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss:SSS'
});

const printFormat = printf(({
    level,
    message,
    label,
    timestamp
}) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

const env = process.env.NODE_ENV || 'development';

const pathDir = `../../${process.env.appLogggerDirectory}`;

var logDir = path.join(__dirname, pathDir);


// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
    fs.mkdirSync(logDir + '/engine');
}

logDir = logDir + '/engine';


const dailyRotateFileTransport = new transports.DailyRotateFile({
    filename: `${logDir}/%DATE%/engine.log`,
    datePattern: 'YYYY-MM-DD'
});


const logger = createLogger({
    // change level if in dev environment versus production
    level: env === 'development' ? 'debug' : 'info',
    json: true,
    format: format.combine(
        timeFormate,
        format.printf(
            info => `${info.timestamp} : ${info.level} : ${info.message}`
        )),
    transports: [
        // new transports.File({
        //     level: 'info',
        //     handleExceptions: true,
        //     filename: `${logDir}/info.log`,
        //     json: true,
        //     format: format.combine(
        //         format.colorize(),
        //         format.printf(
        //             info => `${info.timestamp}:${info.message}`
        //         )
        //     )
        // }),
        new transports.File({
            level: 'error',
            handleExceptions: false,
            filename: `${logDir}/error.log`,
            json: true,
            format: format.combine(
                format.colorize(),
                format.printf(
                    info => `${info.timestamp} : ${info.message}`
                )
            )
        }),
        new transports.Console({
            level: env === 'development' ? 'debug' : 'error',
            handleExceptions: true,
            json: false,
            format: format.combine(
                format.colorize(),
                timeFormate,
                format.printf(
                    info => `${info.level}  : ${info.message}`
                )
            )
        }),
        dailyRotateFileTransport
    ],
    exceptionHandlers: [
        new transports.File({
            filename: `${logDir}/exceptions.log`
        })
    ],
    exitOnError: false

});

logger.info("Logger Directory ::-- " + logDir);


module.exports = logger;