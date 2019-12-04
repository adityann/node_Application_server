var resDis = require('../util/redis/redisConnection')


resDis.insertTriggerDataToCache('762437562756-wash', 12344437897);


resDis.checkTriggeFromCache('762437562756-wash', (err, res) => {
    // resolve(res)
});

var promise1 = new Promise(function (resolve, reject) {
    resolve('Success!');
});

promise1.then(function (value) {
    console.log(value);
    // expected output: "Success!"
});

var id = '762437562756-rinse'

var time = '12344437897';

if (typeof time != "number") {

    time = Number(time)
    console.log(time)
}


var checkWashFlag = new Promise((resolve, reject) => {
    resDis.checkTriggeFromCache(id, (err, res) => {
        if (err) {
            reject(err);
        }
        resolve(res);
    });
});

checkWashFlag.then(function (value) {
    if (!value) {
        resDis.insertTriggerDataToCache(id, 12344437897);
    } else {
        console.info("Wash Falg Already ")
    }
});


//console.log(resDisFlag)