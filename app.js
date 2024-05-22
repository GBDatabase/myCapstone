import express from "express";

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/about", (req, res) => {
  res.send("About!");
});

app.get("/setting", (req, res) => {
  res.send("Setting!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});