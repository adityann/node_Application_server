//var url = "http://dev-intellidish.diverseyiot.com/"
//var url = "http://18.224.146.118:80"

var url = "http://localhost:3006";

const io = require('socket.io-client')(url);
const io1 = require('socket.io-client')(url);
const io2 = require('socket.io-client')(url);


var tempUser = [{
    userName: "Ashish",
    userEmail: "a@gmail.com",
    macId: "001ec0f15793"
}, {
    userName: "nurul",
    userEmail: "n@gmail.com",
    macId: "d8803996d025"
}, {
    userName: "nurul",

    userEmail: "n@gmail.com",
    macId: "d8803996d025"
}]


io.on('connect', () => {
    console.log("--------------------------\n")

    io.emit("addUser", tempUser[0]);
    //console.log(io.id);
});

io.on('error', (error) => {
   // console.log(error);
});
io.on("livedata", function (data) {
    console.log("--------------------------\n")
    console.log(data);
});

io.on("welcome", function (data) {
    console.log("--------------------------\n")

    console.log(data);
});


io1.on('connect', () => {
    //  io1.emit("addUser", tempUser[1]);
    //  console.log(io1.id);
});

io1.on("livedata", function (data) {
    console.log(data);
});
io1.on("welcome", function (data) {
    console.log(data);
});

setTimeout(() => {

    // io2.on('connect', () => {

    //     io2.emit("addUser", tempUser[2]);
    //     // console.log(io1.id);
    // });

    // io2.on("livedata", function (data) {
    //     console.log(data);
    // });
    // io2.on("welcome", function (data) {
    //     console.log(data);
    // });
}, 20000);

setTimeout(() => {
    io.emit("removeUser", tempUser[0]);
}, 20000)