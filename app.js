import express from "express";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "sbsst",
  password: "sbs123414",
  database: "wise_saying",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const app = express();
const port = 3000;

app.get("/wise-sayings", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM wise_saying ORDER BY id DESC");

  res.json(rows);
});

app.get("/wise-sayings/:id", async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query("SELECT * FROM wise_saying WHERE id = ?", [
    id,
  ]);

  res.json(rows[0]);
});
app.delete("/wise-sayings/:id", async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.query("SELECT * FROM wise_saying WHERE id = ?", [
    id,
  ]);

  if (rows.length == 0) {
    res.status(404).send("not found");
    return;
  }

  const [rs] = await pool.query(
    `
    DELETE FROM wise_saying
    WHERE id = ?
    `,
    [id]
  );

  res.status(200).json({
    id,
  });
});

app.patch("/wise-sayings/:id", async (req, res) => {
  const { id } = req.params;

  const { author, content } = req.body;
  const [rows] = await pool.query("SELECT * FROM wise_saying WHERE id = ?", [
    id,
  ]);
  if (rows.length == 0) {
    res.status(404).send("not found");
    return;
  }
  if (!author) {
    res.status(400).json({
      msg: "author required",
    });
    return;
  }
  if (!content) {
    res.status(400).json({
      msg: "content required",
    });
    return;
  }
  const [rs] = await pool.query(
    `
    UPDATE wise_saying
    SET content = ?,
    author = ?
    WHERE id = ?
    `,
    [content, author, id]
  );
  res.status(200).json({
    id,
    author,
    content,
  });
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});