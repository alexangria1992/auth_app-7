import express from "express";
import colors from "colors";
import mysql from "mysql";
import bcrypt from "bcrypt";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import "dotenv/config";

//EXPRESS INITIALIZATION
const app = express();

//Express middleeware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5174"],
    methods: ["POST", "GET"],
    credentials: true,
  })
);
app.use(cookieParser());

//DB Connection
const db = mysql.createConnection({
  user: "root",
  host: "localhost",
  password: "",
  database: "nodejsdbtwo",
});

db.connect(function (err) {
  if (err) {
    console.error("erro connecting: " + err.stack);
    return;
  }
  console.log(colors.magenta("Connected to database"));
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

//BCRYPT
app.get("/hash", (req, res) => {
  bcrypt.hash("123456", 10, (err, hash) => {
    if (err) return res.json({ Error: "Error in hashing password" });
    const values = [hash];
    return res.json({ result: hash });
  });
});

app.post("/register", async (req, res) => {
  const { name, email, password, confPassword } = req.body;
  if (password !== confPassword)
    return res
      .status(400)
      .json({ msg: "Password and Confirm Password do not match" });

  let hashedPassword = await bcrypt.hash(password, 8);
  console.log(hashedPassword);

  db.query(
    `INSERT INTO users SET ?`,
    { name: name, email: email, password: hashedPassword },
    (error, results) => {
      if (error) {
        console.log(error);
      } else {
        console.log(results);
        res.json({ Status: "Successful Registration" });
      }
    }
  );
});

// LOGIN USER
app.post("/login", (req, res) => {
  const sql = "SELECT * FROM users Where email = ?";
  db.query(sql, [req.body.email], (err, result) => {
    if (err)
      return res.json({ Status: "Error", Error: "Error in running query" });
    if (result.length > 0) {
      bcrypt.compare(
        req.body.password.toString(),
        result[0].password,
        (err, response) => {
          if (err) return res.json({ Error: "password error" });
          if (response) {
            // const token = jwt.sign({ role: "admin" }, "jwt-secret-key", {
            //   expiresIn: "1d",
            // });
            const name = result[0].name;
            const token = jwt.sign({ name }, "jwt-secret-key", {
              expiresIn: "1d",
            });
            res.cookie("token", token);
            return res.json({ Status: "Success" });
          } else {
            return res.json({
              Status: "Error",
              Error: "Wrong Email or Password",
            });
          }
        }
      );
    } else {
      return res.json({ Status: "Error", Error: "Wrong Email or Password" });
    }
  });
});

const port = 3001;

app.listen(port, () => {
  console.log(colors.cyan(`Server running on port ${port}`));
});
