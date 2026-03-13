const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

let credential;

try {
  // Priority 1: BASE64 (Best for Hostinger/Production) 
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    console.log("🔐 Loading Firebase credentials from BASE64 environment variable...");
    const base64String = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.trim();
    const jsonString = Buffer.from(base64String, 'base64').toString('utf-8');
    credential = admin.credential.cert(JSON.parse(jsonString));
    console.log("✅ Firebase initialized successfully from BASE64");
  } 
  // Priority 2: Raw JSON String
  else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log("🔐 Loading Firebase credentials from JSON environment variable...");
    let rawJson = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    if (rawJson.startsWith('"') || rawJson.startsWith("'")) rawJson = rawJson.slice(1, -1);
    const serviceAccount = JSON.parse(rawJson.replace(/\\n/g, '\n'));
    credential = admin.credential.cert(serviceAccount);
    console.log("✅ Firebase initialized successfully from JSON string");
  }
  // Priority 3: Local file (Fallback for your MacBook Development)
  else {
    const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
    if (fs.existsSync(serviceAccountPath)) {
      console.log("📁 Loading Firebase credentials from local serviceAccountKey.json...");
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
      credential = admin.credential.cert(serviceAccount);
      console.log("✅ Firebase initialized successfully from local file");
    } else {
      throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_BASE64 env var and local JSON file not found.");
    }
  }
} catch (error) {
  console.error("❌ Firebase Initialization Error:", error.message);
  process.exit(1);
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  const defaultBucket = "acadmate-78932.firebasestorage.app";
  const bucketName = process.env.FIREBASE_BUCKET || defaultBucket;

  admin.initializeApp({
    credential: credential,
    storageBucket: bucketName,
  });
  console.log("🚀 Firebase Admin SDK initialized");
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

module.exports = { db, admin };