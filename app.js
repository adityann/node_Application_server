const createError = require('http-errors');

const express = require("express");
const app = express();

const logger = require('./startup/logger');

const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require('cors');
const compression = require('compression');


// added swagger module
const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');
const alert = require('./routes/api/alerts');



const pac = require("./routes/pac/pac");

// live data from DB if Socket connection Failed
const live_aggregator = require('./routes/api/livePage');

const alerts = require('./routes/api/alertPage');

const setting = require('./routes/api/setting');

const authToken = require('./middeleware/auth');

const pacUrl = process.env.PAC_ROOT_URL;

// app.set('trust proxy', 1);
//swagger
// swagger definition
const swaggerDefinition = {
    info: {
        title: 'Node Swagger API',
        version: '1.0.0',
        description: 'Demonstrating how to describe a RESTful API with Swagger',
    },
    host: process.env.host,
    basePath: '/intellidish',
};

// options for the swagger docs
const options = {
    // import swaggerDefinitions
    swaggerDefinition: swaggerDefinition,
    // path to the API docs
    apis: ['./routes/pac/*.js', './routes/api/*.js'],
};

// initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);


//swagger end



app.set('pacUrl', pacUrl);

app.use(express.json());
app.use(compression());

app.use(cors({}));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(helmet());
app.use(ignoreFavicon);

//app.use(logger);

//for swagger
app.use(express.static(path.join(__dirname, 'public')));
//end


app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Authorization');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Accept', 'application/json');
    next();
});


// Add a handler to inspect the req.secure flag (see 
// http://expressjs.com/api#req.secure). This allows us 
// to know whether the request was via http or https.
// app.use(function (req, res, next) {
//     if (!req.secure) {
//         // request was via https, so do no special handling
//         res.redirect('https://' + req.headers.host + "/" + req.url);
//         next();
//     }

// });

app.use('/intellidish', cors(), authToken.validateToken, [pac, live_aggregator, setting,alerts, alert]);
//app.use('/intellidish', cors(), [pac, live_aggregator, setting,alerts])

// app.use('/api', cors(), live_aggregator)


//adding swagger
// serve swagger
app.get('/swagger.json', function (req, res) {
    res.send(swaggerSpec);
});
//swager end


function ignoreFavicon(req, res, next) {
    if (req.originalUrl === '/favicon.ico') {
        res.status(204).json({
            nope: true
        });
    } else {
        next();
    }
}


/********* error handlers **************/

app.use(notFoundErrors);
app.use(logErrors)
app.use(clientErrorHandler)
app.use(errorHandler)

function notFoundErrors(req, res, next) {
    res.status(404);
    res.format({
        json: function () {
            res.json({
                status: "error",
                code: 404,
                error: `${req.url} 'Not Found'`
            })
        },
        default: function () {
            res.type('txt').send('Not found')
        }
    })
}

function logErrors(err, req, res, next) {
    logger.error(`url:'${req.url}'  ${JSON.stringify(err)}`);
    next(err)
}

function clientErrorHandler(err, req, res, next) {
    if (req.xhr) {
        res.status(500);
        res.json({
            'status': 'error',
            "code": 500,
            "message": "oops Some thing went wrong Server",
            "description": err
        })
    } else {
        next(err)
    }
}

function errorHandler(err, req, res, next) {
    res.status(500);
    res.json({
        'status': 'error',
        "code": 500,
        "message": "error in server",
        "description": err
    })
}


module.exports = app;