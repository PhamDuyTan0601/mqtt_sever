const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// 🚨 THÊM DÒNG NÀY ĐỂ KIỂM TRA BIẾN MÔI TRƯỜNG
console.log("🔧 Environment Check:");
console.log("PORT:", process.env.PORT);
console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ Found" : "❌ Missing");

const app = express();

// ================================
// ✅ CORS CONFIG
// ================================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "userId"],
    credentials: true,
  })
);

app.use(express.json());

// ================================
// 🔗 ROUTES - THÊM TRY-CATCH ĐỂ DEBUG
// ================================
try {
  app.use("/api/users", require("./routes/userRoutes"));
  app.use("/api/pets", require("./routes/petRoutes"));
  app.use("/api/petData", require("./routes/petDataRoutes"));
  app.use("/api/devices", require("./routes/deviceRoutes"));
  console.log("✅ All routes loaded successfully");
} catch (error) {
  console.error("❌ Route loading error:", error);
}

// ================================
// 💓 HEALTH CHECK
// ================================
app.get("/", (req, res) => {
  res.json({
    message: "Pet Tracker API is running on Railway!",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    port: process.env.PORT,
  });
});

// ================================
// 🧠 DATABASE CONNECTION - THÊM ERROR HANDLING
// ================================
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch((err) => {
      console.log("❌ MongoDB Connection Error:", err.message);
      console.log("💡 Check your MONGO_URI in Railway environment variables");
    });
} else {
  console.log("❌ MONGO_URI is missing in environment variables");
}

// ================================
// 🚀 START SERVER - DÙNG PORT TỪ ENV
// ================================
const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 HTTP Server running on port ${PORT}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
});

module.exports = app;
