const config = {
    "development": {
        "config_id": "development",
        "app_name": "engine",
        "app_desc": "",
        "app_port": 80,
        "json_indentation": 4,
        "pac_url": "https://qa-pac.diverseyiot.com/api/v1/",
        "database": {
            mysql: {
                connectionLimit: process.env.connectionLimit || 10,
                host: process.env.mysqlHost,
                user: process.env.mysqlUser,
                port: process.env.mysqlPort,
                password: process.env.mysqlPassword,
                database: process.env.mysqlDatabase
            }
        }

    },
    "test": {
        "config_id": "testing",
        "app_name": "engine",
        "app_desc": "",
        "node_port": 80,
        "json_indentation": 4,
        "pac_url": "https://qa-pac.diverseyiot.com/api/v1/",
        "database": {
            mysql: {
                connectionLimit: 10,
                host: 'intellidish-live.c21lokzah43h.us-east-2.rds.amazonaws.com',
                user: process.env.mysqlUser,
                port: process.env.mysqlPort,
                password: process.env.mysqlPassword,
                database: process.env.mysqlDatabase
            },
            cassandra: {
                host: '18.188.163.21',
                port: 9042,
                database: 'intellidish'
            }
        },
        "redis": {
            "host": "localhost",
            "port": 6379
        }
    },
    "stage": {
        "config_id": "staging",
        "app_name": "engine",
        "app_desc": "",
        "node_port": 3000,
        "json_indentation": 4,
        "pac_url": "https://dev-pac.diverseyiot.com/api/v1/",
        "database": {
            mysql: {
                connectionLimit: 10,
                host: 'intellidish-live.c21lokzah43h.us-east-2.rds.amazonaws.com',
                user: process.env.mysqlUser,
                port: process.env.mysqlPort,
                password: process.env.mysqlPassword,
                database: process.env.mysqlDatabase
            },
            cassandra: {
                host: '18.188.163.21',
                port: 9042,
                database: 'intellidish'
            }
        },
        "redis": {
            "host": "",
            "port": 6379
        }
    },
    "production": {
        "config_id": "production",
        "app_name": "engine",
        "app_desc": "",
        "node_port": 80,
        "json_indentation": 4,
        "pac_url": "https://qa-pac.diverseyiot.com/api/v1/",
        "database": {
            mysql: {
                connectionLimit: 10,
                host: 'intellidish-live.c21lokzah43h.us-east-2.rds.amazonaws.com',
                user: process.env.mysqlUser,
                port: process.env.mysqlPort,
                password: process.env.mysqlPassword,
                database: process.env.mysqlDatabase
            },
            cassandra: {
                host: '18.188.163.21',
                port: 9042,
                database: 'intellidish'
            }
        },
        "redis": {
            "host": "",
            "port": 6379
        }
    }
}

let env = process.env.NODE_ENV;
if (env == 'dev') env = 'development';
if (env == 'prod') env = 'production';
if (env == 'uat') env = 'stage';


module.exports = config[env]