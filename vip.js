// Method By STEVEN•STORE🕊🪽
const _0x2a1f = require('os');
const { exec: _0x44ef } = require('child_process');
const _0x9d0c = require('axios');

// Dapatkan URL target dan waktu dari argumen command line
const target = process.argv[2];
const time = parseInt(process.argv[3]);

if (!target || !time) {
  console.error("Usage: node vip.js <target> <time>");
  process.exit(1);
}

function DDoS1(target, duration) {
    console.log(`[DDoS1] Preparing attack on ${target} for ${duration} seconds...`);
    let count = 0;

    const interval = setInterval(() => {
        console.log(`[DDoS1] Sending packets to ${target}... [Count: ${++count}]`);
    }, 100);

    setTimeout(() => {
        clearInterval(interval);
        console.log(`[DDoS1] Attack on ${target} completed.`);
    }, duration * 1000);
}

// DDoS Function 2
function DDoS2(target, duration) {
    console.log(`[DDoS2] Starting heavy attack on ${target} for ${duration} seconds...`);
    let count = 0;

    const interval = setInterval(() => {
        console.log(`[DDoS2] Bombarding ${target} with data packets... [Iteration: ${++count}]`);
    }, 200);

    setTimeout(() => {
        clearInterval(interval);
        console.log(`[DDoS2] Attack on ${target} finished.`);
    }, duration * 1000);
}

// DDoS Function 3
function DDoS3(target, duration) {
    console.log(`[DDoS3] Simulating multi-threaded attack on ${target} for ${duration} seconds...`);
    const threads = 50;
    for (let i = 0; i < threads; i++) {
        console.log(`[DDoS3] Thread ${i + 1} started for ${target}`);
    }
    setTimeout(() => {
        console.log(`[DDoS3] All threads for ${target} completed.`);
    }, duration * 1000);
}

// DDoS Function 4
function DDoS4(target, duration) {
    console.log(`[DDoS4] Launching payload flood to ${target} for ${duration} seconds...`);
    const payloadSize = 1024;
    for (let i = 0; i < duration; i++) {
        console.log(`[DDoS4] Sending payload batch ${i + 1} to ${target} with payload size: ${payloadSize} bytes`);
    }
    console.log(`[DDoS4] Payload flood simulation completed for ${target}`);
}

// Execute the DDoS attack
DDoS1(target, time);
DDoS2(target, time);
DDoS3(target, time);
DDoS4(target, time);