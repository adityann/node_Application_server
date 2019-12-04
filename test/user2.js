const io = require('socket.io-client')("http://localhost:3001");
// { query: "id=avinash" });

const io1 = require('socket.io-client')("http://localhost:3001");


var tempUser = [{
    userName: "Vivek Singh",
    userEmail: "viveksingh@diversey.com"
}, {
    userName: "Avinash k Singh",
    userEmail: "avinash.Kumar@diversey.com"
}]

io.emit("addUser", tempUser[0]);
io1.emit("addUser", tempUser[1]);

io.on('connect', () => {
    console.log(tempUser[0].userEmail + "   " + io.id);
});

io1.on('connect', () => {
    console.log(tempUser[1].userEmail+"    "+io1.id);
});


io.on("livedata", function (data) {
    console.log(data);
});

io1.on("livedata", function (data) {
    console.log(data);
});

