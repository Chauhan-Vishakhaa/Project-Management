const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { getDashboardData, getOverdueTasks } = require("../queries/dashboardQueries");

// ─── GET DASHBOARD DATA ───────────────────────────────────
// Any logged in user can see their dashboard
// GET /api/dashboard
router.get("/", requireAuth, async (req, res) => {
  try {
    const data = await getDashboardData(req.user.id);
    res.status(200).json(data);
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── GET OVERDUE TASKS ────────────────────────────────────
// GET /api/dashboard/overdue
router.get("/overdue", requireAuth, async (req, res) => {
  try {
    const tasks = await getOverdueTasks(req.user.id);
    res.status(200).json(tasks);
  } catch (err) {
    console.error("Overdue tasks error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;