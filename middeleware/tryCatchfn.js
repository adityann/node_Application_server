const logger = require('../startup/logger')
module.exports = fn =>
    () => {
        try {
            fn()
        } catch (e) {
            let logLineDetails = ((e.stack).split("at ")[3]).trim();
            logger.error(logLineDetails);

        }
    }