const net = require('net');

function startPing(ip, duration) {
    const endTime = Date.now() + (duration * 1000);
    const interval = 100; // Interval dalam milidetik

    function ping() {
        const client = new net.Socket();
        client.connect(80, ip, () => {
            client.end();
        });

        client.on('error', (err) => {
            // Handle error if needed
        });

        if (Date.now() < endTime) {
            setTimeout(ping, interval);
        }
    }

    ping();
}

if (require.main === module) {
    const ip = process.argv[2];
    const duration = parseInt(process.argv[3], 10);

    if (!ip || isNaN(duration)) {
        console.log('Usage: node StartPing.js [ip] [duration]');
        process.exit(1);
    }

    startPing(ip, duration);
}