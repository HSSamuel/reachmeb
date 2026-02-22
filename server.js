require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport"); // ✅ Added Passport import

// ✅ Load Passport Strategies so they are available globally
require("./config/passport");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize()); // ✅ Initialize Passport middleware

// Basic Health Check Route
app.get("/", (req, res) => {
  res.send("ReachMe API is running...");
});

// Use Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/profiles", require("./routes/profiles"));
app.use("/api/links", require("./routes/links"));
app.use("/api/products", require("./routes/products"));
app.use("/api/subscribers", require("./routes/subscribers"));
app.use("/api/upload", require("./routes/upload"));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// ✅ START SERVER ONLY AFTER MONGODB CONNECTS
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");

    // Start listening for requests now that the DB is ready
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
  });
