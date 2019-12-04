//var url = "http://18.217.48.135:80"
var url = "http://localhost:3003"

const io = require('socket.io-client')(url);
const io1 = require('socket.io-client')(url);
const io2 = require('socket.io-client')(url);
const io3 = require('socket.io-client')(url);


var tempUser = [{
    userName: "Ashish",
    userEmail: "a@gmail.com",
    macId: "001ec0f118ee"
}, {
    userName: "nurul",
    userEmail: "n@gmail.com",
    macId: "001ec0f118ee"
}, {
    userName: "nurul",
    userEmail: "n@gmail.com",
    macId: "d8803997065",
    oldMacId: "001ec0f118ee_test"
}]


io.on('connect', () => {
    io.emit("addUser", tempUser[0]);
    //console.log(io.id);
});

io.on('error', (error) => {
    //console.log(error);
});
io.on("livedata", function (data) {
    console.log("--------------------------\n")
    console.log(data);
});

io.on("welcome", function (data) {
    console.log("--------------------------\n")
    console.log(data);
});
