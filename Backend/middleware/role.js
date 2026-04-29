const pool = require("../db");

// ✅ Use this on routes where only PROJECT ADMIN can act
// Example: create task, delete project, add member
const requireProjectAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id; // comes from requireAuth

    // project_id can come from URL params OR request body
    // example: PUT /api/projects/:id → req.params.id
    // example: POST /api/tasks → req.body.project_id
    const projectId = req.params.id || req.body.project_id;

    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    // Check if user exists in this project AND is admin
    const result = await pool.query(
      `SELECT role FROM project_members
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: "You are not a member of this project" });
    }

    if (result.rows[0].role !== "admin") {
      return res.status(403).json({ error: "Only project admins can perform this action" });
    }

    next(); // ✅ user is admin, move forward
  } catch (err) {
    console.error("requireProjectAdmin error:", err);
    res.status(500).json({ error: "Server error during role check" });
  }
};

// ✅ Use this on routes where ANY PROJECT MEMBER can act
// Example: update task status, view tasks
const requireProjectMember = async (req, res, next) => {
  try {
    const userId = req.user.id; // comes from requireAuth

    // For task routes, we get project via the task id
    // because URL is PUT /api/tasks/:id (no project_id in URL)
    const taskId = req.params.id;

    const result = await pool.query(
      `SELECT pm.role
       FROM project_members pm
       JOIN tasks t ON t.project_id = pm.project_id
       WHERE t.id = $1 AND pm.user_id = $2`,
      [taskId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: "You are not a member of this project" });
    }

    next(); // ✅ user is a member, move forward
  } catch (err) {
    console.error("requireProjectMember error:", err);
    res.status(500).json({ error: "Server error during role check" });
  }
};

module.exports = { requireProjectAdmin, requireProjectMember };