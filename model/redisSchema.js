const schema = require('schm');
const {
    validate
} = schema


const fillWater = schema({
    "conductivity": {
        type: Number,
        default: null
    },
    "timeStamp": {
        type: Number,
        default: null
    },
    "timeDiff": {
        type: Number,
        required: true
    }
});

let fillWaterObject = validate({
    "conductivity": 123,
    "timeDiff": "dfghjk"
}, fillWater);

fillWaterObject.then((obj) => {
    console.log(obj)

})
// nested schema
const redisObject = schema({
    users: [exports.fillWater],
})