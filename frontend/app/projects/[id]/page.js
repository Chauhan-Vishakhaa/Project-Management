"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function ProjectDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  const [user, setUser] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add member form
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberError, setMemberError] = useState("");

  // Add task form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium",
    due_date: "",
  });
  const [taskError, setTaskError] = useState("");

  useEffect(() => {
    // 1. Check token
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(userData));
    fetchProject(token);
  }, [id]);

  const fetchProject = async (token) => {
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setProject(data);
    } catch (err) {
      setError("Failed to load project.");
    } finally {
      setLoading(false);
    }
  };


  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/projects/${id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: memberEmail, role: "member" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMemberError(data.error);
        return;
      }

      // Reset and refresh
      setMemberEmail("");
      setShowMemberForm(false);
      fetchProject(token);
    } catch (err) {
      setMemberError("Something went wrong.");
    }
  };


  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...taskData,
          project_id: id,
          // if assigned_to is empty string send null
          assigned_to: taskData.assigned_to || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTaskError(data.error);
        return;
      }

      // Reset and refresh
      setTaskData({
        title: "",
        description: "",
        assigned_to: "",
        priority: "medium",
        due_date: "",
      });
      setShowTaskForm(false);
      fetchProject(token);
    } catch (err) {
      setTaskError("Something went wrong.");
    }
  };


  const handleStatusChange = async (taskId, newStatus) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchProject(token); // refresh project data
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };


  const handleDeleteTask = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchProject(token);
      }
    } catch (err) {
      console.error("Delete task error:", err);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm("Remove this member?")) return;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `http://localhost:5000/api/projects/${id}/members/${memberId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        fetchProject(token);
      }
    } catch (err) {
      console.error("Remove member error:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  // Check if logged in user is admin of this project
  const isAdmin = project?.my_role === "admin";

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <div className="flex gap-6">
          <span className="font-bold text-blue-600">Task Manager</span>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-blue-600">Dashboard</Link>
          <Link href="/projects" className="text-sm text-gray-600 hover:text-blue-600">Projects</Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="p-6">

        {/* Project Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {project.description || "No description"}
            </p>
            <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${
              isAdmin ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
            }`}>
              Your role: {project.my_role}
            </span>
          </div>
          <Link href="/projects" className="text-sm text-blue-600 hover:underline">
            ← Back to Projects
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* LEFT — Tasks Section */}
          <div className="md:col-span-2">
            <div className="bg-white rounded shadow p-4">

              {/* Tasks Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Tasks ({project.tasks?.length || 0})</h2>
                {/* Only admin can create tasks */}
                {isAdmin && (
                  <button
                    onClick={() => setShowTaskForm(!showTaskForm)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    {showTaskForm ? "Cancel" : "+ Add Task"}
                  </button>
                )}
              </div>

              {/* Add Task Form — admin only */}
              {showTaskForm && (
                <div className="border rounded p-4 mb-4 bg-gray-50">
                  <h3 className="font-medium mb-3 text-sm">New Task</h3>

                  {taskError && (
                    <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-3 text-sm">
                      {taskError}
                    </div>
                  )}

                  <form onSubmit={handleCreateTask}>
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <input
                        type="text"
                        value={taskData.title}
                        onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                        className="w-full border rounded px-3 py-2 text-sm"
                        placeholder="Task title"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={taskData.description}
                        onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                        className="w-full border rounded px-3 py-2 text-sm"
                        placeholder="Task description"
                        rows={2}
                      />
                    </div>

         
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Assign To</label>
                      <select
                        value={taskData.assigned_to}
                        onChange={(e) => setTaskData({ ...taskData, assigned_to: e.target.value })}
                        className="w-full border rounded px-3 py-2 text-sm"
                      >
                        <option value="">Unassigned</option>
                        {project.members?.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} ({member.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Priority</label>
                        <select
                          value={taskData.priority}
                          onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
                          className="w-full border rounded px-3 py-2 text-sm"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Due Date</label>
                        <input
                          type="date"
                          value={taskData.due_date}
                          onChange={(e) => setTaskData({ ...taskData, due_date: e.target.value })}
                          className="w-full border rounded px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      Create Task
                    </button>
                  </form>
                </div>
              )}

              {/* Tasks List */}
              {project.tasks?.length === 0 ? (
                <p className="text-sm text-gray-500">No tasks yet.</p>
              ) : (
                <div className="space-y-3">
                  {project.tasks?.map((task) => (
                    <div key={task.id} className="border rounded p-3">

                      {/* Task Title + Priority */}
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-sm">{task.title}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          task.priority === "high"
                            ? "bg-red-100 text-red-600"
                            : task.priority === "medium"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-green-100 text-green-600"
                        }`}>
                          {task.priority}
                        </span>
                      </div>

                      {/* Description */}
                      {task.description && (
                        <p className="text-xs text-gray-500 mb-2">{task.description}</p>
                      )}

                      {/* Assigned to + Due date */}
                      <div className="flex gap-4 text-xs text-gray-500 mb-2">
                        <span>
                          👤 {task.assigned_to_name || "Unassigned"}
                        </span>
                        {task.due_date && (
                          <span>
                            📅 {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Status dropdown + Delete */}
                      <div className="flex justify-between items-center">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className="text-xs border rounded px-2 py-1"
                        >
                          <option value="todo">Todo</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>

                        {/* Only admin can delete */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

          {/* RIGHT — Members Section */}
          <div>
            <div className="bg-white rounded shadow p-4">

              {/* Members Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Members ({project.members?.length || 0})</h2>
                {/* Only admin can add members */}
                {isAdmin && (
                  <button
                    onClick={() => setShowMemberForm(!showMemberForm)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    {showMemberForm ? "Cancel" : "+ Add"}
                  </button>
                )}
              </div>

              {/* Add Member Form — admin only */}
              {showMemberForm && (
                <div className="border rounded p-3 mb-4 bg-gray-50">
                  {memberError && (
                    <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-3 text-sm">
                      {memberError}
                    </div>
                  )}
                  <form onSubmit={handleAddMember}>
                    <input
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm mb-2"
                      placeholder="member@email.com"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Add Member
                    </button>
                  </form>
                </div>
              )}

              {/* Members List */}
              <div className="space-y-2">
                {project.members?.map((member) => (
                  <div key={member.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        member.role === "admin"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {member.role}
                      </span>
                      {/* Admin can remove members but not themselves */}
                      {isAdmin && member.id !== user?.id && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}