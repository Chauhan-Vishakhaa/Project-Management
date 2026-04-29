"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create project form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    // 1. Check token
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(userData));
    fetchProjects(token);
  }, []);

  const fetchProjects = async (token) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error("Fetch projects error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      // Reset form and refresh list
      setFormData({ name: "", description: "" });
      setShowForm(false);
      fetchProjects(token);
    } catch (err) {
      setError("Something went wrong.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) return <p className="p-6">Loading...</p>;

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

      {/* Page Content */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">My Projects</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "+ New Project"}
          </button>
        </div>

        {/* Create Project Form */}
        {showForm && (
          <div className="bg-white rounded shadow p-4 mb-6">
            <h2 className="font-semibold mb-4">Create New Project</h2>

            {error && (
              <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Project Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                Create Project
              </button>
            </form>
          </div>
        )}

        {/* Projects List */}
        {projects.length === 0 ? (
          <div className="bg-white rounded shadow p-6 text-center text-gray-500">
            No projects yet. Create your first project!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded shadow p-4">

                {/* Project Name */}
                <h2 className="font-semibold text-lg mb-1">{project.name}</h2>

                {/* Description */}
                <p className="text-sm text-gray-500 mb-3">
                  {project.description || "No description"}
                </p>

                {/* Stats */}
                <div className="flex gap-4 text-sm text-gray-500 mb-3">
                  <span>👥 {project.member_count} members</span>
                  <span>📋 {project.task_count} tasks</span>
                </div>

                {/* Role Badge */}
                <span className={`text-xs px-2 py-1 rounded ${
                  project.my_role === "admin"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {project.my_role}
                </span>

                {/* View Button */}
                <div className="mt-3">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Project →
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}