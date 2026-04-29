const pool = require("../db");

// ─── GET ALL TASKS FOR A PROJECT ──────────────────────────
const getTasksByProject = async (projectId) => {
  const result = await pool.query(
    `SELECT t.*, 
            u.name AS assigned_to_name,
            u2.name AS created_by_name
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assigned_to
     LEFT JOIN users u2 ON u2.id = t.created_by
     WHERE t.project_id = $1
     ORDER BY t.created_at DESC`,
    [projectId]
  );
  return result.rows;
};

// ─── GET SINGLE TASK ──────────────────────────────────────
const getTaskById = async (taskId) => {
  const result = await pool.query(
    `SELECT t.*,
            u.name AS assigned_to_name,
            u2.name AS created_by_name
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assigned_to
     LEFT JOIN users u2 ON u2.id = t.created_by
     WHERE t.id = $1`,
    [taskId]
  );
  return result.rows[0];
};

// ─── CREATE TASK ──────────────────────────────────────────
const createTask = async (title, description, projectId, assignedTo, priority, dueDate, createdBy) => {
  // Check if assigned user is a member of the project
  if (assignedTo) {
    const isMember = await pool.query(
      `SELECT id FROM project_members
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, assignedTo]
    );
    if (isMember.rows.length === 0) {
      throw new Error("Assigned user is not a member of this project");
    }
  }

  const result = await pool.query(
    `INSERT INTO tasks (title, description, project_id, assigned_to, priority, due_date, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [title, description, projectId, assignedTo || null, priority || "medium", dueDate || null, createdBy]
  );
  return result.rows[0];
};

// ─── UPDATE TASK ──────────────────────────────────────────
// Member can update status
// Admin can update everything
const updateTask = async (taskId, fields) => {
  const { title, description, status, priority, due_date, assigned_to } = fields;

  const result = await pool.query(
    `UPDATE tasks
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         status = COALESCE($3, status),
         priority = COALESCE($4, priority),
         due_date = COALESCE($5, due_date),
         assigned_to = COALESCE($6, assigned_to)
     WHERE id = $7
     RETURNING *`,
    [title, description, status, priority, due_date, assigned_to, taskId]
  );
  return result.rows[0];
};

// ─── DELETE TASK ──────────────────────────────────────────
const deleteTask = async (taskId) => {
  await pool.query(
    `DELETE FROM tasks WHERE id = $1`,
    [taskId]
  );
};

// ─── GET TASKS ASSIGNED TO A USER ─────────────────────────
const getMyTasks = async (userId) => {
  const result = await pool.query(
    `SELECT t.*,
            p.name AS project_name,
            u.name AS assigned_to_name
     FROM tasks t
     JOIN projects p ON p.id = t.project_id
     LEFT JOIN users u ON u.id = t.assigned_to
     WHERE t.assigned_to = $1
     ORDER BY t.due_date ASC NULLS LAST`,
    [userId]
  );
  return result.rows;
};

module.exports = {
  getTasksByProject,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getMyTasks,
};