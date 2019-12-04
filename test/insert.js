var fs = require('fs');

var logsFolder = require('path').join(__dirname, "../../../workspaceTest/data-Ashu/data")

var lines = [];

fs.readdir(logsFolder, (err, files) => {
    if (err) {
        console.log(err);
        return;
    }
    files.forEach(function (filename) {
        if (filename.match(/-plxs/g)) {
            let key = filename.split('-')[0];
            lines.push({
                [key]: filename
            })
        }

    })
})
const {
    execFile
} = require('child_process');

setTimeout(() => {
    console.log(lines)

    execFile('node', [`/home/avinash/workspace/test/tm/testMessages/newTestMessage.js`, `/home/avinash/workspaceTest/data-Ashu/data/${Object.values(lines[0])}`, `${Object.keys(lines[0])}`],
        (error, stdout, stderr) => {
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
        });
}, 1000)

process.stdin.setRawMode(true);