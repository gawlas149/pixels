const fs = require("fs");
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("app"));

function startServer() {
  app.get("/db", (req, res) => {
    const file = fs.readFileSync("db");
    res.send(file.toString());
  });
  app.get("/db/add/:index/:color", (req, res) => {
    const color = req.params.color;
    const index = parseInt(req.params.index);
    if (/^[0-9A-F]{6}$/i.test(color) === false || index < 0 || index > 1023) {
      res.sendStatus(400);
      return;
    }

    const file = fs.readFileSync("db");
    let db = JSON.parse(file.toString());

    db[index] = color;

    const data = JSON.stringify(db);
    fs.writeFileSync("db", data);

    res.sendStatus(200);
  });

  app.listen(port, () =>
    console.log(`Example app listening at http://localhost:${port}`)
  );
}
startServer();
