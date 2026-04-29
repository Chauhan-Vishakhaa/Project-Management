const pool = require("../db");
const bcrypt = require("bcryptjs");

const createUser = async (name, email, password) => {
  
  const existingUser = await pool.query(
    `SELECT id FROM users WHERE email = $1`,
    [email],
  );

  if (existingUser.rows.length > 0) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (name, email, password)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, role, created_at`,
    [name, email, hashedPassword],
  );

  return result.rows[0]; // return the created user (no password)
};

const findUserByEmail = async (email) => {
  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);

  return result.rows[0]; // returns full user row including password
};

module.exports = { createUser, findUserByEmail };
