
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(userData));
    fetchDashboard(token);
  }, []);

  const fetchDashboard = async (token) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStats(data.stats);
      setRecentTasks(data.recent_tasks);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
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
        <div className="flex gap-6 items-center">
          <span className="font-bold text-blue-600 text-lg">
            Task Manager
          </span>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-blue-600">
            Dashboard
          </Link>
          <Link href="/projects" className="text-sm text-gray-600 hover:text-blue-600">
            Projects
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Page Content */}
      <div className="p-6">

        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-gray-500 text-sm">My Tasks</p>
              <p className="text-3xl font-bold">{stats.total_my_tasks}</p>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-gray-500 text-sm">Overdue</p>
              <p className="text-3xl font-bold text-red-500">
                {stats.overdue_tasks}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-gray-500 text-sm">Projects</p>
              <p className="text-3xl font-bold">
                {stats.total_projects}
              </p>
            </div>

          </div>
        )}

        {/* Task Overview */}
        {stats && (
          <div className="bg-white rounded-xl shadow p-5 mb-6">
            <h2 className="font-semibold mb-4">Task Overview</h2>

            <div className="flex justify-between text-center">

              <div className="flex-1">
                <p className="text-gray-500 text-sm">Todo</p>
                <p className="text-xl font-bold">{stats.todo}</p>
              </div>

              <div className="flex-1">
                <p className="text-gray-500 text-sm">In Progress</p>
                <p className="text-xl font-bold text-yellow-500">
                  {stats.in_progress}
                </p>
              </div>

              <div className="flex-1">
                <p className="text-gray-500 text-sm">Done</p>
                <p className="text-xl font-bold text-green-500">
                  {stats.done}
                </p>
              </div>

            </div>
          </div>
        )}

        {/* Recent Tasks */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold mb-4">Recent Tasks</h2>

          {recentTasks.length === 0 ? (
            <p className="text-sm text-gray-500">
              No tasks assigned yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2">Task</th>
                  <th className="pb-2">Project</th>
                  <th className="pb-2">Priority</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Due Date</th>
                </tr>
              </thead>

              <tbody>
                {recentTasks.slice(0, 5).map((task) => (
                  <tr key={task.id} className="border-b last:border-0">

                    <td className="py-2">{task.title}</td>

                    <td className="py-2 text-gray-500">
                      {task.project_name}
                    </td>

                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        task.priority === "high"
                          ? "bg-red-100 text-red-600"
                          : task.priority === "medium"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-green-100 text-green-600"
                      }`}>
                        {task.priority}
                      </span>
                    </td>

                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        task.status === "done"
                          ? "bg-green-100 text-green-600"
                          : task.status === "in_progress"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {task.status}
                      </span>
                    </td>

                    <td className="py-2 text-gray-500">
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString()
                        : "No due date"}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}