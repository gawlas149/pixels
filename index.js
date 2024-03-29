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
  const cursors = {};
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
      const res = clients[i].res;
      res.write("event: draw\n");
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  });

  app.get("/db/events/:id", (req, res) => {
    const headers = {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
    };
    res.writeHead(200, headers);

    const clientId = req.params.id;
    const newClient = {
      id: clientId,
      res,
    };
    clients.push(newClient);
    cursors[clientId] = { posX: 0, posY: 0, color: "7515c4" };

    req.on("close", () => {
      delete cursors[clientId];
      clients = clients.filter((c) => c.id !== clientId);
      const event = { id: clientId };
      for (let i = 0; i < clients.length; i++) {
        const res = clients[i].res;
        res.write("event: cursorDel\n");
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    });
  });

  app.get("/cursors/:id/:posX/:posY", (req, res) => {
    res.sendStatus(200);
    const id = req.params.id;
    const posX = req.params.posX;
    const posY = req.params.posY;

    if (cursors[id]) {
      cursors[id].posX = posX;
      cursors[id].posY = posY;
    }

    const event = { id, posX, posY };
    for (let i = 0; i < clients.length; i++) {
      if (clients[i].id == id) {
        continue;
      }
      const res = clients[i].res;
      res.write("event: cursor\n");
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  });

  app.get("/cursors/:id", (req, res) => {
    const cursor = cursors[req.params.id];
    res.send(JSON.stringify(cursor));
  });

  app.get("/cursorColor/:id/:color", (req, res) => {
    res.sendStatus(200);
    const id = req.params.id;
    const color = req.params.color;

    cursors[id].color = color;

    const event = { id, color };
    for (let i = 0; i < clients.length; i++) {
      if (clients[i].id == id) {
        continue;
      }
      const res = clients[i].res;
      res.write("event: cursorColor\n");
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  });

  app.get("/cursors", (req, res) => {
    res.send(JSON.stringify(cursors));
  });

  app.listen(port, () =>
    console.log(`Example app listening at http://localhost:${port}`)
  );
}
startServer();
