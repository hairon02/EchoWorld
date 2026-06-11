const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { connectToMongo } = require("./db/mongo");
const apiRouter = require("./routes");
const config = require("./utils/config");
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use("/api", apiRouter);

app.get("/", (req, res) => {
  res.json({ success: true, message: "EchoWorld server running" });
});

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);
  socket.on("disconnect", () => console.log("socket disconnected:", socket.id));
});

async function start() {
  try {
    await connectToMongo();
  } catch (err) {
    console.error("Continuing without MongoDB due to error");
  }

  const port = config.PORT || 3001;
  server.listen(port, () =>
    console.log(`Server listening on ${port}`),
  );
}

start();
