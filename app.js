const {
    Kafka,
    CompressionTypes,
    CompressionCodecs,
    logLevel,
} = require("kafkajs");
const { WebSocketServer } = require("ws");
const EventEmitter = require("events");
const SnappyCodec = require("kafkajs-snappy");

CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;

const wss = new WebSocketServer({ port: 8080 });
const eventEmitter = new EventEmitter();

wss.on("connection", (socket) => {
    eventEmitter.on("consumed", (data) => {
        socket.send(JSON.stringify(data));
    });
});

const kafka = new Kafka({
    clientId: "students-app",
    brokers: ["localhost:9092"],
    logLevel: logLevel.INFO,
});

const consumer = kafka.consumer({ groupId: "students-app-0" });

async function main() {
    await consumer.connect();
    await consumer.subscribe({ topic: "students", fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const data = {
                key: message.key?.toString(),
                value: message.value.toString(),
            };

            eventEmitter.emit("consumed", data);
        },
    });
}

(async () => {
    try {
        await main();
    } catch (error) {
        console.error(error);

        try {
            await consumer.disconnect();
        } catch (e) {
            console.error("Failed to gracefully disconnect consumer", e);
        }

        wss.close();
        process.exit(1);
    }
})();

const errorTypes = ["unhandledRejection", "uncaughtException"];
const signalTraps = ["SIGTERM", "SIGINT", "SIGUSR2"];

errorTypes.map((type) => {
    process.on(type, async (e) => {
        try {
            console.log(`process.on ${type}`);
            console.error(e);
            wss.close();
            await consumer.disconnect();
            process.exit(0);
        } catch (_) {
            process.exit(1);
        }
    });
});

signalTraps.map((type) => {
    process.once(type, async () => {
        try {
            wss.close();
            await consumer.disconnect();
        } finally {
            process.kill(process.pid, type);
        }
    });
});
