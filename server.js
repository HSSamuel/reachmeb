require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");

require("./config/passport");

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "https://reachme.netlify.app",
      "http://localhost:5173",
    ].filter(Boolean),
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser()); 
app.use(passport.initialize());

app.get("/", (req, res) => {
  res.send("ReachMe API is running...");
});

// Use Routes
const linksRouter = require("./routes/links"); // Extracted to a variable
app.use("/api/auth", require("./routes/auth"));
app.use("/api/profiles", require("./routes/profiles"));
app.use("/api/links", linksRouter);
app.use("/api/products", require("./routes/products"));
app.use("/api/subscribers", require("./routes/subscribers"));
app.use("/api/upload", require("./routes/upload"));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
  });

// ✅ PERFORMANCE: Graceful shutdown hook to flush remaining clicks
const gracefulShutdown = async () => {
  console.log("Shutting down gracefully...");
  if (linksRouter.flushClicks) {
    console.log("Flushing final batched clicks to database...");
    await linksRouter.flushClicks();
  }
  await mongoose.connection.close();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);