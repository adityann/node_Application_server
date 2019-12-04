class Socket {
    constructor(machineID, ...object) {
        this.machineID = machineID;
        this.object = object;
    }
    get key() {
        return this.date + "_" + this.id;
    }
}
module.exports = Socket;