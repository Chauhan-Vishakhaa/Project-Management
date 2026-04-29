const pool = require("../db");

const getDashboardData = async (userId) => {
  // Run all queries in parallel using Promise.all
  // Same pattern as society project
  const [
    myTasks,
    overdueTasks,
    projectStats,
    recentTasks,
    taskStatusCount,
  ] = await Promise.all([

    // 1. All tasks assigned to me
    pool.query(
      `SELECT COUNT(*) AS total_my_tasks
       FROM tasks t
       JOIN project_members pm ON pm.project_id = t.project_id
       WHERE t.assigned_to = $1`,
      [userId]
    ),

    // 2. Overdue tasks (due_date passed and not done)
    pool.query(
      `SELECT COUNT(*) AS overdue_count
       FROM tasks t
       WHERE t.assigned_to = $1
       AND t.due_date < CURRENT_DATE
       AND t.status != 'done'`,
      [userId]
    ),

    // 3. Projects I am part of
    pool.query(
      `SELECT COUNT(*) AS total_projects
       FROM project_members
       WHERE user_id = $1`,
      [userId]
    ),

    // 4. Recent 5 tasks assigned to me
    pool.query(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date,
              p.name AS project_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.assigned_to = $1
       ORDER BY t.created_at DESC
       LIMIT 5`,
      [userId]
    ),

    // 5. Task count by status (todo, in_progress, done)
    pool.query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'todo') AS todo,
         COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
         COUNT(*) FILTER (WHERE status = 'done') AS done
       FROM tasks
       WHERE assigned_to = $1`,
      [userId]
    ),
  ]);

  return {
    stats: {
      total_my_tasks: parseInt(myTasks.rows[0].total_my_tasks),
      overdue_tasks: parseInt(overdueTasks.rows[0].overdue_count),
      total_projects: parseInt(projectStats.rows[0].total_projects),
      todo: parseInt(taskStatusCount.rows[0].todo),
      in_progress: parseInt(taskStatusCount.rows[0].in_progress),
      done: parseInt(taskStatusCount.rows[0].done),
    },
    recent_tasks: recentTasks.rows,
  };
};

// ─── GET ALL OVERDUE TASKS ────────────────────────────────
const getOverdueTasks = async (userId) => {
  const result = await pool.query(
    `SELECT t.id, t.title, t.status, t.priority, t.due_date,
            p.name AS project_name,
            u.name AS assigned_to_name
     FROM tasks t
     JOIN projects p ON p.id = t.project_id
     LEFT JOIN users u ON u.id = t.assigned_to
     WHERE t.assigned_to = $1
     AND t.due_date < CURRENT_DATE
     AND t.status != 'done'
     ORDER BY t.due_date ASC`,
    [userId]
  );
  return result.rows;
};

module.exports = { getDashboardData, getOverdueTasks };