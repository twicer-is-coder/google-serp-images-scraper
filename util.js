const fs = require("fs")
const https = require('https');
const readline = require('readline');

const getElementsByXpath = async (xpath, page) => {
    let elements = await page.$x(xpath);
    if (elements.length === 0) throw new Error("No Elements Found! " + xpath)
    else {
        console.log("Elements length: " + elements.length)
        // for (const elem of elements) {
        //     console.log(await elem.evaluate(el => el.textContent))
        // }
        return elements
    }
}
const getElementByXpath = async (xpath, page) => {
    const elements = await page.$x(xpath);
    if (elements.length === 0) throw new Error("No Element Found! " + xpath);
    else if (elements.length === 1) return elements[0]
    else {
        console.log("Elements length: " + elements.length)
        return elements
    }
}
function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};

    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');

    return response;
}

const download = (url, destination) => new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);

    https.get(url, response => {
        response.pipe(file);

        file.on('finish', () => {
            file.close(resolve(true));
        });
    }).on('error', error => {
        fs.unlink(destination);

        reject(error.message);
    });
});

const delay = (time) => {
    //console.log("Waiting For " + time)
    return new Promise(function (resolve) {
        let seconds = time / 1000
        const timer = setInterval(function () {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`Waiting For ${seconds} Seconds.`);
            readline.moveCursor(process.stdout, 0, 0);
            if (seconds <= 1) {
                console.log(" Timed Up.")
                resolve(clearInterval(timer))
            }
            else seconds--
        }, 1000);
        //setTimeout(resolve, time)
    });
}

const centerAndBorder = async e => {
    await e.evaluate(e => e.scrollIntoView({ behavior: "smooth", block: "center" }));
    e.evaluate(e => e.style.border = 'solid red 10px');
}

module.exports = { getElementsByXpath, getElementByXpath, download, delay, centerAndBorder, decodeBase64Image }