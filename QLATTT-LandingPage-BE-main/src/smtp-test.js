const net = require("net");

const socket = net.createConnection(587, "smtp-relay.brevo.com");

socket.on("connect", () => {
  console.log("TCP OK");
  socket.end();
});

socket.on("error", (err) => {
  console.log("BLOCKED:", err.message);
});