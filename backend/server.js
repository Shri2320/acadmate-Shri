// require("dotenv").config();
// const { db, admin } = require("./config/firebase"); // Firebase config
// const express = require("express");
// const cors = require("cors");
// const helmet = require("helmet");
// const rateLimit = require("express-rate-limit");
// const cron = require("node-cron");
// // const admin = require("firebase-admin"); // Already imported above
// const multer = require("multer");

// /* ================================
//    EXPRESS APP
// ================================ */
// const app = express();

// /* ================================
//    SECURITY & MIDDLEWARE
// ================================ */
// app.use(helmet());

// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       "http://localhost:5174",
//       "http://localhost:3000",
//       // "https://acadmate-lac.vercel.app",
//       process.env.CLIENT_URL,
//     ],
//     credentials: true,
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// /* ================================
//    RATE LIMITERS
// ================================ */
// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100,
//   message: "Too many requests, please try again later.",
// });

// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 10,
//   message: "Too many login attempts, try again later.",
// });

// app.use("/api", apiLimiter);

// /* ================================
//    ROUTES
// ================================ */
// const authRoutes = require("./routes/authRoutes");
// const profileRoutes = require("./routes/profileRoutes");
// const reminderRoutes = require("./routes/reminderRoutes");
// const attendanceRoutes = require("./routes/attendance");
// const discussionsRouter = require("./routes/discussions");
// const commentsRouter = require("./routes/comments");
// const uploadRouter = require("./routes/upload");

// app.use("/api/auth", authLimiter, authRoutes);
// app.use("/api/profile", profileRoutes);
// app.use("/api/reminder", reminderRoutes);
// app.use("/api/attendance", attendanceRoutes);
// app.use("/api/discussions", discussionsRouter);
// app.use("/api/comments", commentsRouter);
// app.use("/api/upload", uploadRouter);

// /* ================================
//    HEALTH CHECK
// ================================ */
// app.get("/api/health", (req, res) => {
//   let bucketName = "not initialized";

//   if (admin.apps.length && admin.storage) {
//     try {
//       bucketName = admin.storage().bucket().name;
//     } catch (err) {
//       bucketName = "error fetching bucket";
//     }
//   }

//   res.json({
//     status: "OK",
//     timestamp: new Date().toISOString(),
//     firebase: admin.apps.length ? "initialized" : "not initialized",
//     bucket: bucketName,
//   });
// });

// /* ================================
//    ROOT
// ================================ */
// app.get("/", (req, res) => {
//   res.json({ message: "🚀 Acadmate Backend API Running" });
// });

// /* ================================
//    CRON JOB (Daily Reminder)
// ================================ */
// const { sendEventReminders } = require("./controllers/reminderController");

// cron.schedule("0 8 * * *", async () => {
//   console.log("⏰ Running daily reminder job...");
//   try {
//     await sendEventReminders();
//   } catch (err) {
//     console.error("❌ Reminder cron error:", err);
//   }
// });

// /* ================================
//    GLOBAL ERROR HANDLER
// ================================ */
// app.use((err, req, res, next) => {
//   console.error("🔥 Server error:", err);

//   if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
//     return res.status(400).json({
//       success: false,
//       message: "File too large. Max 10MB allowed.",
//     });
//   }

//   res.status(err.status || 500).json({
//     success: false,
//     message:
//       process.env.NODE_ENV === "development" ? err.message : "Internal server error",
//   });
// });

// /* ================================
//    404 HANDLER
// ================================ */
// app.use("*", (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "Route not found",
//   });
// });

// /* ================================
//    START SERVER
// ================================ */
// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`
// ╔════════════════════════════════════════╗
// ║   🚀 Server running on port ${PORT}     ║
// ║   🌐 http://localhost:${PORT}/api/health ║
// ║   🔥 Firebase Admin: READY              ║
// ╚════════════════════════════════════════╝
//   `);
// });

// module.exports = app;


require("dotenv").config();
const { db, admin } = require("./config/firebase");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");
const multer = require("multer");

/* ================================
   EXPRESS APP
================================ */
const app = express();

/* ================================
   SECURITY & MIDDLEWARE
================================ */
app.use(helmet());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "https://acadmate.eu",       // Your new production domain
      "https://www.acadmate.eu",   // Standard www version
      process.env.CLIENT_URL,      // Keep this for flexibility in Hostinger hPanel
    ].filter(Boolean),             // Removes undefined values if CLIENT_URL isn't set
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ================================
   RATE LIMITERS
================================ */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: "Too many requests, please try again later.",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 15, // Slightly increased for production to account for retries
  message: "Too many login attempts, try again later.",
});

app.use("/api", apiLimiter);

/* ================================
   ROUTES
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
   HEALTH CHECK (Updated for Hostinger Email)
================================ */
app.get("/api/health", (req, res) => {
  let bucketName = "not initialized";

  if (admin.apps.length && admin.storage) {
    try {
      bucketName = admin.storage().bucket().name;
    } catch (err) {
      bucketName = "error fetching bucket";
    }
  }

  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    firebase: admin.apps.length ? "initialized" : "not initialized",
    bucket: bucketName,
    // Verifies if Hostinger Email variables are loaded (without showing passwords)
    emailService: {
      configured: !!process.env.MAIL_USER,
      user: process.env.MAIL_USER ? "verified" : "missing",
      host: process.env.MAIL_HOST || "not set"
    }
  });
});

/* ================================
   ROOT
================================ */
app.get("/", (req, res) => {
  res.json({ message: "🚀 Acadmate Backend API Running" });
});

/* ================================
   CRON JOB (Daily Reminder)
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
   GLOBAL ERROR HANDLER
================================ */
app.use((err, req, res, next) => {
  console.error("🔥 Server error:", err);

  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Max 10MB allowed.",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

/* ================================
   404 HANDLER
================================ */
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ================================
   START SERVER
================================ */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 Server running on port ${PORT}     ║
║   🌐 http://localhost:${PORT}/api/health ║
║   📧 Email Service: Hostinger SMTP     ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;