const WebSocket = require("ws");

const ws = new WebSocket("ws://localhost:3000");

ws.on("open", function open() {
    console.log("opened connection");
});

ws.on("message", function message(data) {
    const buf = Buffer.from(data);
    console.log(JSON.parse(buf.toString()));
});

ws.on("close", () => {
    console.log("connected closed");
});
