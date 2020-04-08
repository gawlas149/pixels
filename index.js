const fs = require("fs");
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("app"));

const size = 3025;

function startServer() {
  let clients = [];

  app.get("/db", (req, res) => {
    const file = fs.readFileSync("db");
    res.send(file.toString());
  });
  app.get("/db/add/:index/:color", (req, res) => {
    const color = req.params.color;
    const index = parseInt(req.params.index);
    if (/^[0-9A-F]{6}$/i.test(color) === false || index < 0 || index > 3024) {
      res.sendStatus(400);
      return;
    }

    const file = fs.readFileSync("db");
    let db = JSON.parse(file.toString());

    db[index] = color;

    const data = JSON.stringify(db);
    fs.writeFileSync("db", data);

    res.sendStatus(200);

    const event = { color, index };
    for (let i = 0; i < clients.length; i++) {
      clients[i].res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  });

  app.get("/db/test", (req, res) => {
    const headers = {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
    };
    res.writeHead(200, headers);

    const clientId = Date.now();
    const newClient = {
      id: clientId,
      res,
    };
    clients.push(newClient);

    req.on("close", () => {
      clients = clients.filter((c) => c.id !== clientId);
    });
  });

  app.listen(port, () =>
    console.log(`Example app listening at http://localhost:${port}`)
  );
}
startServer();
