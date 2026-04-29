const jwt = require("jsonwebtoken");
require("dotenv").config();

const requireAuth = (req, res, next) => {
  // 1. Get the token from request header
  // Frontend sends: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  // 2. Extract just the token part (remove "Bearer ")
  const token = authHeader.split(" ")[1];

  // 3. Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded will be: { id: 1, email: "...", role: "admin" }

    req.user = decoded; // attach user info to request
    next();             // move to next middleware or route
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = { requireAuth };