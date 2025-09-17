const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// เชื่อม Database
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error("❌ DB connection error:", err);
  } else {
    console.log("✅ Connected to database");
  }
});

// API POST เพื่อสั่งอุปกรณ์
app.post("/device", (req, res) => {
  const { device, action } = req.body;
  if (!device || !action) return res.status(400).json({ success: false });

  const sql = "UPDATE devices SET status = ? WHERE name = ?";
  db.query(sql, [action, device], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    console.log(`✅ ${device} => ${action}`);
    res.json({ success: true });
  });
});

// API GET เพื่อ ESP32 อ่านสถานะล่าสุด
app.get("/device", (req, res) => {
  const sql = "SELECT name, status FROM devices";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err });
    const devices = {};
    results.forEach((row) => {
      devices[row.name] = row.status;
    });
    res.json(devices);
  });
});

app.listen(process.env.PORT, () => {
  console.log(`API running on port ${process.env.PORT}`);
});
