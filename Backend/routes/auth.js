const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { createUser, findUserByEmail } = require("../queries/authQueries");
require("dotenv").config();

// ─── SIGNUP ───────────────────────────────────────────────
// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  // 1. Validate - all fields required
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }

  // 2. Basic email format check
  if (!email.includes("@")) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // 3. Password length check
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    // 4. Create user in DB (query handles hashing + duplicate check)
    const newUser = await createUser(name, email, password);

    // 5. Generate JWT token
    const token = jwt.sign(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 6. Send back token + user info
    res.status(201).json({
      message: "Signup successful",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    // Handle duplicate email error from query
    if (err.message === "Email already registered") {
      return res.status(400).json({ error: err.message });
    }
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error during signup" });
  }
});

// ─── LOGIN ────────────────────────────────────────────────
// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // 1. Validate
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // 2. Find user by email
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // 3. Compare password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // 4. Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5. Send back token + user info
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

module.exports = router;