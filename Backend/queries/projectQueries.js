const pool = require("../db");

const getUserProjects = async (userId) => {
  const result = await pool.query(
    `SELECT p.id, p.name, p.description, p.created_at,
            pm.role AS my_role,
            u.name AS created_by_name,
            COUNT(DISTINCT pm2.user_id) AS member_count,
            COUNT(DISTINCT t.id) AS task_count
     FROM projects p
     JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
     JOIN users u ON u.id = p.created_by
     LEFT JOIN project_members pm2 ON pm2.project_id = p.id
     LEFT JOIN tasks t ON t.project_id = p.id
     GROUP BY p.id, p.name, p.description, p.created_at, pm.role, u.name
     ORDER BY p.created_at DESC`,
    [userId],
  );
  return result.rows;
};

const getProjectById = async (projectId, userId) => {
  const project = await pool.query(
    `SELECT p.*, u.name AS created_by_name, pm.role AS my_role
     FROM projects p
     JOIN users u ON u.id = p.created_by
     JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
     WHERE p.id = $1`,
    [projectId, userId],
  );

  if (project.rows.length === 0) return null;

  const members = await pool.query(
    `SELECT u.id, u.name, u.email, pm.role
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1`,
    [projectId],
  );

  const tasks = await pool.query(
    `SELECT t.*, u.name AS assigned_to_name
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assigned_to
     WHERE t.project_id = $1
     ORDER BY t.created_at DESC`,
    [projectId],
  );

  return {
    ...project.rows[0],
    members: members.rows,
    tasks: tasks.rows,
  };
};

const createProject = async (name, description, userId) => {
  const project = await pool.query(
    `INSERT INTO projects (name, description, created_by)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, description, userId],
  );

  const newProject = project.rows[0];

  await pool.query(
    `INSERT INTO project_members (project_id, user_id, role)
     VALUES ($1, $2, 'admin')`,
    [newProject.id, userId],
  );

  return newProject;
};

const addMember = async (projectId, email, role) => {
  // 1. Find user by email
  const user = await pool.query(
    `SELECT id, name, email FROM users WHERE email = $1`,
    [email],
  );

  if (user.rows.length === 0) {
    throw new Error("User with this email not found");
  }

  const userId = user.rows[0].id;

  const existing = await pool.query(
    `SELECT id FROM project_members
     WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId],
  );

  if (existing.rows.length > 0) {
    throw new Error("User is already a member of this project");
  }

  await pool.query(
    `INSERT INTO project_members (project_id, user_id, role)
     VALUES ($1, $2, $3)`,
    [projectId, userId, role || "member"],
  );

  return user.rows[0];
};

const removeMember = async (projectId, userId) => {
  await pool.query(
    `DELETE FROM project_members
     WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId],
  );
};

const deleteProject = async (projectId) => {
  await pool.query(`DELETE FROM projects WHERE id = $1`, [projectId]);
};

module.exports = {
  getUserProjects,
  getProjectById,
  createProject,
  addMember,
  removeMember,
  deleteProject,
};
