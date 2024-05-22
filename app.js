import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "sbsst",
  password: "sbs123414",
  database: "TodoDB",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

const app = express();

const corsOptions = {
  origin: "https://cdpn.io",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.use(express.json());

const port = 3000;

app.get("/:user_code/todos", async (req, res) => {
  const { user_code } = req.params;

  const [rows] = await pool.query(
    `
    SELECT *
    FROM todo
    WHERE user_code = ?
    ORDER BY id DESC
    `,
    [user_code]
  );

  res.json({
    resultCode: "S-1",
    msg: "성공",
    data: rows,
  });
});

app.get("/:user_code/todos/:no", async (req, res) => {
  const { user_code, no } = req.params;

  const [[todoRow]] = await pool.query(
    `
    SELECT *
    FROM todo
    WHERE user_code = ?
    AND no = ?
    `,
    [user_code, no]
  );

  if (todoRow === undefined) {
    res.status(404).json({
      resultCode: "F-1",
      msg: "not found",
    });
    return;
  }

  res.json({
    resultCode: "S-1",
    msg: "성공",
    data: todoRow,
  });
});

app.patch("/:user_code/todos/:no", async (req, res) => {
  const { user_code, no } = req.params;

  const [[todoRow]] = await pool.query(
    `
    SELECT *
    FROM todo
    WHERE user_code = ?
    AND no = ?
    `,
    [user_code, no]
  );

  if (todoRow === undefined) {
    res.status(404).json({
      resultCode: "F-1",
      msg: "not found",
    });
    return;
  }

  const {
    content = todoRow.content,
    perform_date = todoRow.perform_date,
    is_completed = todoRow.is_completed,
  } = req.body;

  await pool.query(
    `
    UPDATE todo
    SET update_date = NOW(),
    content = ?,
    perform_date = ?,
    is_completed = ?
    WHERE user_code = ?
    AND no = ?
    `,
    [content, perform_date, is_completed, user_code, no]
  );

  const [[justModifiedTodoRow]] = await pool.query(
    `
    SELECT *
    FROM todo
    WHERE user_code = ?
    AND no = ?
    `,
    [user_code, no]
  );

  res.json({
    resultCode: "S-1",
    msg: "성공",
    data: justModifiedTodoRow,
  });
});

app.delete("/:user_code/todos/:no", async (req, res) => {
  const { user_code, no } = req.params;

  const [[todoRow]] = await pool.query(
    `
    SELECT *
    FROM todo
    WHERE user_code = ?
    AND no = ?
    `,
    [user_code, no]
  );

  if (todoRow === undefined) {
    res.status(404).json({
      resultCode: "F-1",
      msg: "not found",
    });
    return;
  }

  await pool.query(
    `
    DELETE FROM todo
    WHERE user_code = ?
    AND no = ?
    `,
    [user_code, no]
  );

  res.json({
    resultCode: "S-1",
    msg: `${no}번 할일을 삭제하였습니다`,
  });
});

app.post("/:user_code/todos", async (req, res) => {
  const { user_code } = req.params;

  const { content, perform_date, is_completed = 0 } = req.body;

  if (!content) {
    res.status(400).json({
      resultCode: "F-1",
      msg: "content required",
    });
    return;
  }

  if (!perform_date) {
    res.status(400).json({
      resultCode: "F-1",
      msg: "perform_date required",
    });
    return;
  }

  const [[lastTodoRow]] = await pool.query(
    `
    SELECT no
    FROM todo
    WHERE user_code = ?
    ORDER BY id DESC
    LIMIT 1
    `,
    [user_code]
  );

  const no = lastTodoRow?.no + 1 || 1;

  const [insertTodoRs] = await pool.query(
    `
    INSERT INTO todo
    SET reg_date = NOW(),
    update_date = NOW(),
    user_code = ?,
    no = ?,
    content = ?,
    perform_date = ?,
    is_completed = ?
    `,
    [user_code, no, content, perform_date, is_completed]
  );

  const [[justCreatedTodoRow]] = await pool.query(
    `
    SELECT *
    FROM todo
    WHERE id = ?
    `,
    [insertTodoRs.insertId]
  );

  res.json({
    resultCode: "S-1",
    msg: `${justCreatedTodoRow.id}번 할일을 생성하였습니다`,
    data: justCreatedTodoRow,
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});