const net = require("net");
const port = Number(process.env.PORT || 5000);

const tester = net.createServer();
tester.once("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log("BUSY");
    process.exit(2);
  }
  console.log("ERROR", err.message);
  process.exit(1);
});
tester.once("listening", () => {
  tester.close(() => {
    console.log("FREE");
    process.exit(0);
  });
});
tester.listen(port);
