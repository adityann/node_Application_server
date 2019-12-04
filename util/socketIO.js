const socketIO = require("socket.io");
const logger = require("../startup/logger");

const io = socketIO({
    //  path:"/socket",
    secure: true,
    rejectUnauthorized: false,
    origins: ["*"],
    transports: ["polling", "websocket"]
});

const socketApi = {
    io: io
}

var rooms = [];

const message = {
    welcome: "Welcome to IntelliDish",
}
const event = {
    user: "user",
    welcome: "welcome",
    alert: "alert",
    live: "livedata"
}


// custom id must be unique

// io.use(function(socket, next) {
//     var handshakeData = socket.request;
//     console.log("id:", handshakeData._query["id"]);
//     next();
//   });

//Cross-Origin
//io.origins(["*:*", "https://dev-intellidish.diverseyiot.com/"]);

io.origins((origin, callback) => {
    callback(null, true);
});
// Creating Connection 
io.on("connection", function (socket) {

    // socket.use((packet, next) => {
    //     if (packet.doge === true) return next();
    //     next(new Error('Not a doge error'));
    //   });

    io.to(socket.id).emit(event.welcome, `${message.welcome}`);

    // crete/add User to rooms on connection
    socket.on("addUser", function (dataResponse) {

        if (dataResponse) {
            let resData = {
                userEmail: dataResponse.userEmail,
                macId: dataResponse.macId
            }
            socket.emit(event.welcome, {
                message: `User "${resData.userEmail}" added with socketId:${socket.id}`
            });

            if (resData.userEmail && resData.macId) {
                let socketRooms = Object.keys(socket.rooms);
                logger.info(`fn:socket added-${resData.macId} in rooms`);

                if (rooms.includes(resData.macId)) {
                    resData.message = `Existing User "${resData.userEmail}" with macId:-${resData.macId} is joined in room ${resData.macId}`;
                    resData.socket_rooms = socketRooms;
                } else {
                    rooms.push(resData.macId);
                    resData.message = `User- "${resData.userEmail}" with macId:-${resData.macId} is joined in room ${resData.macId}`;
                    resData.socket_rooms = socketRooms;
                }
                resData.roomStatus = rooms.includes(resData.macId);
                socket.userEmail = resData.userEmail;
                socket.userMacId = resData.macId;
                socket.join(resData.macId);
            } else {
                resData.message = "Invalid User email/macId"
            }
            socket.emit(event.welcome, resData);
        }
    });

    socket.on("switchMacId", function (dataResponse) {
        if (dataResponse) {
            let [userEmail, macId, oldMacId] = [dataResponse.userEmail, dataResponse.macId, dataResponse.oldMacId];
            let resData = {
                userEmail: userEmail,
                macId: macId,
                old_macId: oldMacId
            }
            let socketData = {};
            if (macId != oldMacId) {
                if (userEmail && macId && oldMacId) {
                    if (rooms.includes(macId)) {
                        resData.message = `User-${userEmail} left room ${oldMacId}`;
                        //Leave room 
                        socket.leave(oldMacId);
                        socket.in(oldMacId).broadcast.emit(event.welcome, resData);
                        //Join Room
                        socket.join(macId);
                        resData.message = `User-${userEmail} joined room ${macId}`;
                        socket.emit(event.welcome, resData);
                    } else {
                        // create user and join to Rooms
                        rooms.push(macId);

                        //Leave room 
                        socket.leave(oldMacId);
                        resData.message = `User-${userEmail} left room ${oldMacId}`;
                        socket.emit(event.welcome, resData);

                        //Join Room
                        resData.message = `User-${userEmail} joined room ${macId}`;
                        socket.userEmail = userEmail;
                        socket.userMacId = macId;
                        socket.join(macId);
                        socket.emit(event.welcome, resData);
                    }
                } else {
                    socketData.status = "error";
                    socketData.message = "Invalid User email/macId/oldMacId";
                    socket.emit(event.welcome, socketData);
                }

            } else {
                socketData.status = "error";
                socketData.message = "macId and oldMacId is same";
                socket.emit(event.welcome, socketData);
            }
        } else {
            socket.emit(event.welcome, {
                message: "Invalid Object",
                object: dataResponse
            });
        }
    });

    socket.on("removeUser", function (dataResponse) {
        //   console.log(`removed userId ${emailid} with ${socket.id}`);
        socket.emit(event.welcome, {
            userEmail: dataResponse.userEmail + "-" + dataResponse.macId,
            message: "Called RemoverUser"
        })
        if (rooms.includes(dataResponse.macId)) {
            let userEmail = socket.userEmail;
            let macId = socket.userMacId;
            let rooms = Object.keys(socket.rooms);
            let userList = socket.adapter.rooms[macId];
            let noUser = userList.length;

            let connectionMessage = userEmail + " Disconnected from Socket " + socket.id;
            socket.leave(macId);
            if (noUser <= 1) {
                rooms = rooms.slice(rooms.indexOf(macId, 1));
            }
            socket.emit(
                event.welcome, {
                    message: connectionMessage,
                    socket_count: noUser,
                    socket_rooms_eventList: userList,
                    socket_rooms: rooms,
                    macId: macId
                });

        } else {
            socket.emit(event.welcome, {
                message: `${dataResponse.userEmail}-- add user to socket "addUser"`
            });
        }
    });
    socket.on("disconnecting", (reason) => {
        //let rooms = Object.keys(socket.rooms);
        logger.error(`fn:socket message:disconnecting - ${socket.userEmail}-${socket.userMacId} discription:${JSON.stringify(reason)}`)
    });
    socket.on("disconnect", (reason) => {


        let userEmail = socket.userEmail;
        let macId = socket.userMacId;
        let rooms = Object.keys(socket.rooms);
        let userList = socket.adapter.rooms[macId];
        logger.error(`fn:Socket  message:disconnected ${userEmail}-${macId} reason:${JSON.stringify(reason)}`)
        let connectionMessage = userEmail + " Disconnected from Socket " + socket.id;
        socket.emit(
            event.welcome, {
                macId: macId,
                message: connectionMessage,
                socket_count: userList,
                rooms: rooms
            });
        //   socket.connected();
        logger.warn(`fn:Socket  message:disconnected ${userEmail}-${socket.userMacId} reason:${JSON.stringify(reason)}`)
    });
    socket.on("error", (error) => {
        logger.error(`fn:Socket  message: ${socket.userEmail}-${socket.userMacId} error:${JSON.stringify(error)}`)
    });
    // Add a "close" event handler to this instance of socket
    socket.on("close", function (data) {
        let index = socket.findIndex(function (o) {
            return o.remoteAddress === socket.remoteAddress && o.remotePort === socket.remotePort;
        })
        if (index !== -1) socket.splice(index, 1);
        logger.info("socket closed: " + socket.remoteAddress + " " + socket.remotePort);
    });

});

module.exports = {
    socketApi: socketApi,
    sendLiveData: emitterLiveToUSer,
    sendAggData: emitterAggToUSer,
    sendAlert: sendAlert
}


function emitterLiveToUSer(id, data) {
    if (rooms.includes(id)) {
        io.to(id).emit("livedata", data);
        logger.debug(`socket-emitterLiveToUSer-${id}` + JSON.stringify(data));
    } else {
        //  console.error(io.sockets.sockets[io.socket.id].rooms)

        //    console.error(io.sockets.adapter.sids[io.socket.id]);
        logger.warn(`socket-emitterLiveToUSer-${id} ` + JSON.stringify(data));
    }
}


function emitterAggToUSer(id, data) {
    if (rooms.includes(id)) {
        io.to(id).emit("livedata", data);
        logger.debug(`socket-emitterAggToUSer-${id}` + JSON.stringify(data));
    } else {
        //  console.error(io.sockets.sockets[io.socket.id].rooms)
        //     console.error(io.sockets.adapter.sids[io.socket.id]);
        logger.warn(`socket-emitterAggToUSer-${id}` + JSON.stringify(data));
    }

}



function sendAlert(id, data) {
    if (rooms.includes(id)) {
        io.to(id).emit(event.alert, data);
        logger.debug(`socket-sendAlert-${id}` + JSON.stringify(data));
    } else {
        // console.error(io.sockets.sockets[io.socket.id].rooms)
        //   console.error(io.sockets.sockets);
        logger.warn(`socket-sendAlert-${id}`);
    }
}