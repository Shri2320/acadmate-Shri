/* ================================
   Imports & Config
================================ */
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");
const admin = require("firebase-admin");
const multer = require("multer");
require("dotenv").config();

/* ================================
   Firebase Admin Initialization
================================ */
const serviceAccount = require("./config/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_BUCKET || "your-project-id.appspot.com",
});

/* ================================
   Express App
================================ */
const app = express();

/* ================================
   Security & Middleware
================================ */
app.use(helmet());

// Updated CORS: allows any localhost port + production CLIENT_URL
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin.startsWith("http://localhost") || origin === process.env.CLIENT_URL) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ================================
   Rate Limiters
================================ */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts, please try again later.",
});

app.use("/api", apiLimiter);

/* ================================
   Routes
================================ */
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const attendanceRoutes = require("./routes/attendance");
const discussionsRouter = require("./routes/discussions");
const commentsRouter = require("./routes/comments");
const uploadRouter = require("./routes/upload");

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/reminder", reminderRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/discussions", discussionsRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/upload", uploadRouter);

/* ================================
   Health Check
================================ */
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

/* ================================
   Cron Job (Daily Reminder)
================================ */
const { sendEventReminders } = require("./controllers/reminderController");

cron.schedule("0 8 * * *", async () => {
  console.log("⏰ Running daily reminder job...");
  try {
    await sendEventReminders();
  } catch (err) {
    console.error("❌ Reminder cron error:", err);
  }
});

/* ================================
   Global Error Handler
================================ */
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 10MB.",
      });
    }
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

/* ================================
   404 Handler
================================ */
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ================================
   Server Start
================================ */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
