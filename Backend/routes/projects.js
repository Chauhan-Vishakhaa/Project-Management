const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { requireProjectAdmin } = require("../middleware/role");
const {
  getUserProjects,
  getProjectById,
  createProject,
  addMember,
  removeMember,
  deleteProject,
} = require("../queries/projectQueries");

// ─── GET ALL PROJECTS ─────────────────────────────────────
// Any logged in user sees their projects
// GET /api/projects
router.get("/", requireAuth, async (req, res) => {
  try {
    const projects = await getUserProjects(req.user.id);
    res.status(200).json(projects);
  } catch (err) {
    console.error("Get projects error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── GET SINGLE PROJECT ───────────────────────────────────
// Any member of the project can view it
// GET /api/projects/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const project = await getProjectById(req.params.id, req.user.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found or access denied" });
    }
    res.status(200).json(project);
  } catch (err) {
    console.error("Get project error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── CREATE PROJECT ───────────────────────────────────────
// Any logged in user can create a project
// POST /api/projects
router.post("/", requireAuth, async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Project name is required" });
  }

  try {
    const project = await createProject(name, description, req.user.id);
    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── ADD MEMBER ───────────────────────────────────────────
// Only project admin can add members
// POST /api/projects/:id/members
router.post("/:id/members", requireAuth, requireProjectAdmin, async (req, res) => {
  const { email, role } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const member = await addMember(req.params.id, email, role);
    res.status(201).json({
      message: "Member added successfully",
      member,
    });
  } catch (err) {
    if (
      err.message === "User with this email not found" ||
      err.message === "User is already a member of this project"
    ) {
      return res.status(400).json({ error: err.message });
    }
    console.error("Add member error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── REMOVE MEMBER ────────────────────────────────────────
// Only project admin can remove members
// DELETE /api/projects/:id/members/:userId
router.delete("/:id/members/:userId", requireAuth, requireProjectAdmin, async (req, res) => {
  try {
    await removeMember(req.params.id, req.params.userId);
    res.status(200).json({ message: "Member removed successfully" });
  } catch (err) {
    console.error("Remove member error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── DELETE PROJECT ───────────────────────────────────────
// Only project admin can delete project
// DELETE /api/projects/:id
router.delete("/:id", requireAuth, requireProjectAdmin, async (req, res) => {
  try {
    await deleteProject(req.params.id);
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;