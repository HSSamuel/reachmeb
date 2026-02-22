// reachme-backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Get token from the headers
  const token = req.header("Authorization")?.split(" ")[1]; // Expecting "Bearer <token>"

  // Check if no token
  if (!token) {
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Attach user info (like user.id) to the request
    next(); // Move on to the next function/route
  } catch (err) {
    res.status(401).json({ error: "Token is not valid" });
  }
};
