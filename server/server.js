const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // หรือใส่ URL ของ frontend
    methods: ["GET", "POST"],
  },
});

// เชื่อม Database
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) console.error("❌ DB connection error:", err);
  else console.log("✅ Connected to database");
});

// POST เพื่อสั่งอุปกรณ์
app.post("/device", (req, res) => {
  const { device, action } = req.body;
  if (!device || !action) return res.status(400).json({ success: false });

  const sql = "UPDATE devices SET status = ? WHERE name = ?";
  db.query(sql, [action, device], (err) => {
    if (err) return res.status(500).json({ success: false, error: err });

    console.log(`✅ ${device} => ${action}`);

    // ส่งสถานะล่าสุดไปยังทุก client ผ่าน Socket.IO
    const sqlGet = "SELECT name, status FROM devices";
    db.query(sqlGet, (err, results) => {
      if (!err) {
        const devices = {};
        results.forEach((row) => (devices[row.name] = row.status));
        io.emit("updateDevices", devices);
      }
    });

    res.json({ success: true });
  });
});

// GET เพื่ออ่านสถานะล่าสุด
app.get("/device", (req, res) => {
  const sql = "SELECT name, status FROM devices";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err });

    const devices = {};
    results.forEach((row) => (devices[row.name] = row.status));
    res.json(devices);
  });
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  // ส่งสถานะตอนแรก
  db.query("SELECT name, status FROM devices", (err, results) => {
    if (!err) {
      const devices = {};
      results.forEach((row) => (devices[row.name] = row.status));
      socket.emit("updateDevices", devices);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

server.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 API running on port ${process.env.PORT || 5000}`);
});
