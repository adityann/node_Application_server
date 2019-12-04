var socketIO = require("../middleware/socketIO.js");

var PropertiesReader = require("properties-reader");
const EventEmitter = require('events').EventEmitter;
const fs = require('fs');

var properties = PropertiesReader("./newtest.properties");
var users = []

function readData(callback) {
    setTimeout(() => {
        var endpoint = properties.get('config.this.endpoint');
        var time = properties.get('config.this.time');
        var url = properties.get('config.this.url');
        var noOfUser = properties.get('config.this.users');
        callback({ endpoint: endpoint, time: time, url: url, NoOfUser: noOfUser })
    }, 3000)
}


function createUsers(url, no, callback) {
    for (var i = 1; i <= no; i++) {
        users[i] = require("socket.io-client")(url);
    }
    callback()
}


function startListeners(event) {
    console.log(event);
    users.forEach((user, index) => {
        user.on(event, function (err, msg) {
            console.log(msg);
            fs.appendFile('message.txt', "userUpdated " +msg+ " " + index + " " + "package received" + "\n", (err) => {
                if (err) throw err;
                console.log('The data was appended to file!');
            });


        })
    });

}


readData((info) => {
    createUsers(info.url, info.NoOfUser, () => {
        startListeners(info.endpoint);
    })
})


setTimeout(() => {
    process.exit();
}, properties.get('config.this.time'))

