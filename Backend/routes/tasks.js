const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { requireProjectAdmin, requireProjectMember } = require("../middleware/role");
const {
  getTasksByProject,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getMyTasks,
} = require("../queries/taskQueries");

// ─── GET MY TASKS ─────────────────────────────────────────
// Get all tasks assigned to logged in user
// GET /api/tasks/my
router.get("/my", requireAuth, async (req, res) => {
  try {
    const tasks = await getMyTasks(req.user.id);
    res.status(200).json(tasks);
  } catch (err) {
    console.error("Get my tasks error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── GET ALL TASKS FOR A PROJECT ──────────────────────────
// Any project member can view tasks
// GET /api/tasks/project/:projectId
router.get("/project/:projectId", requireAuth, async (req, res) => {
  try {
    const tasks = await getTasksByProject(req.params.projectId);
    res.status(200).json(tasks);
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── GET SINGLE TASK ──────────────────────────────────────
// GET /api/tasks/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const task = await getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json(task);
  } catch (err) {
    console.error("Get task error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── CREATE TASK ──────────────────────────────────────────
// Only project admin can create tasks
// POST /api/tasks
router.post("/", requireAuth, requireProjectAdmin, async (req, res) => {
  const { title, description, project_id, assigned_to, priority, due_date } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Task title is required" });
  }
  if (!project_id) {
    return res.status(400).json({ error: "Project ID is required" });
  }

  try {
    const task = await createTask(
      title,
      description,
      project_id,
      assigned_to,
      priority,
      due_date,
      req.user.id   // created_by = logged in user
    );
    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (err) {
    if (err.message === "Assigned user is not a member of this project") {
      return res.status(400).json({ error: err.message });
    }
    console.error("Create task error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── UPDATE TASK ──────────────────────────────────────────
// Any project member can update task (status change etc)
// PUT /api/tasks/:id
router.put("/:id", requireAuth, requireProjectMember, async (req, res) => {
  try {
    const task = await updateTask(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── DELETE TASK ──────────────────────────────────────────
// Only project admin can delete tasks
// DELETE /api/tasks/:id
router.delete("/:id", requireAuth, requireProjectAdmin, async (req, res) => {
  try {
    // For delete we need project_id for requireProjectAdmin
    // So first get the task to find its project_id
    const task = await getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Manually set project_id on body so requireProjectAdmin can use it
    req.body.project_id = task.project_id;

    await deleteTask(req.params.id);
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;