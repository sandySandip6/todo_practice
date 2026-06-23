"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Todo } from "@/types/todos";
import { getTodos, createTodo, updateTodo, deleteTodo } from "@/services/todos";

export default function TodoDashboard() {
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "alphabetical">("newest");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal State
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCompleted, setEditCompleted] = useState(false);
  const [editError, setEditError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("username");
    router.replace("/login");
  }, [router]);

  const fetchTodos = useCallback(async (token: string) => {
    setLoading(true);
    try {
      const data = await getTodos(token);
      if (data) {
        setTodos(data);
      }
    } catch (err: unknown) {
      console.error("Fetch todos error:", err);
      // If unauthorized, token is likely expired
      const axiosError = err as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  // Load username & todos
  useEffect(() => {
    const initDashboard = () => {
      const token = localStorage.getItem("access_token");
      const storedUsername = localStorage.getItem("username");
      
      if (!token) {
        router.replace("/login");
        return;
      }
      
      setUsername(storedUsername || "User");
      fetchTodos(token);
    };
    const timer = setTimeout(initDashboard, 0);
    return () => clearTimeout(timer);
  }, [router, fetchTodos]);

  // Create Todo
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setCreateError("Title is required");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) return;

    setIsCreating(true);
    setCreateError("");

    try {
      const data = await createTodo(token, newTitle.trim(), newDescription.trim());
      if (data) {
        setTodos((prev) => [data, ...prev]);
        setNewTitle("");
        setNewDescription("");
        setIsCreateOpen(false);
      } else {
        setCreateError("Failed to create task.");
      }
    } catch {
      setCreateError("An error occurred. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle Complete status quickly
  const handleToggleComplete = async (todo: Todo) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    // Optimistic Update
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t))
    );

    try {
      const data = await updateTodo(token, todo.title, todo.description, !todo.completed, todo.id);
      if (!data) {
        // Revert on failure
        setTodos((prev) =>
          prev.map((t) => (t.id === todo.id ? { ...t, completed: todo.completed } : t))
        );
      }
    } catch {
      // Revert on failure
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, completed: todo.completed } : t))
      );
    }
  };

  // Edit Todo Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo) return;
    if (!editTitle.trim()) {
      setEditError("Title is required");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) return;

    setIsUpdating(true);
    setEditError("");

    try {
      const data = await updateTodo(
        token,
        editTitle.trim(),
        editDescription.trim(),
        editCompleted,
        editingTodo.id
      );
      if (data) {
        setTodos((prev) => prev.map((t) => (t.id === editingTodo.id ? data : t)));
        setEditingTodo(null);
      } else {
        setEditError("Failed to update task.");
      }
    } catch {
      setEditError("An error occurred. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Todo
  const handleDelete = async (id: number) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    if (!confirm("Are you sure you want to delete this task?")) return;

    // Optimistic Update
    setTodos((prev) => prev.filter((t) => t.id !== id));

    try {
      await deleteTodo(token, id);
    } catch {
      // Refresh list to sync back
      fetchTodos(token);
    }
  };

  // Open editing modal
  const startEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setEditTitle(todo.title);
    setEditDescription(todo.description);
    setEditCompleted(todo.completed);
    setEditError("");
  };


  // Statistics Computations
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, completionRate };
  }, [todos]);

  // Filter and Sort Todos
  const filteredAndSortedTodos = useMemo(() => {
    let result = [...todos];

    // Apply Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      );
    }

    // Apply Filter
    if (statusFilter === "completed") {
      result = result.filter((t) => t.completed);
    } else if (statusFilter === "active") {
      result = result.filter((t) => !t.completed);
    }

    // Apply Sort
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === "alphabetical") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [todos, searchQuery, statusFilter, sortBy]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 font-sans pb-12 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Navigation Header */}
      <nav className="border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/10">
              ✓
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-350 bg-clip-text text-transparent">
              TaskFlow
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-slate-400">
              Welcome, <span className="font-semibold text-indigo-400">{username}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-3.5 py-1.5 rounded-lg transition-all duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
        {/* Welcome Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              Organize, track, and complete your daily goals.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="self-start sm:self-center bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-650 hover:to-purple-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-indigo-500/10 transition-all duration-250 flex items-center gap-2 group"
          >
            <span className="text-base group-hover:scale-110 transition-transform font-bold">+</span> Add New Task
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-slate-450 text-xs font-semibold uppercase tracking-wider">Total Tasks</p>
              <h3 className="text-2xl font-bold mt-1 text-white">{stats.total}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              📁
            </div>
          </div>

          <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-slate-450 text-xs font-semibold uppercase tracking-wider">Completed</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-400">{stats.completed}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              ✓
            </div>
          </div>

          <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-slate-450 text-xs font-semibold uppercase tracking-wider">Pending</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-405 text-amber-400">{stats.pending}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              ⏳
            </div>
          </div>

          {/* Progress Card */}
          <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 shadow-xl flex items-center gap-4">
            <div className="relative flex items-center justify-center w-14 h-14">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  className="stroke-slate-800"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  className="stroke-indigo-500 transition-all duration-500 ease-out"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 22}
                  strokeDashoffset={2 * Math.PI * 22 * (1 - stats.completionRate / 100)}
                />
              </svg>
              <span className="absolute text-xs font-bold text-white">{stats.completionRate}%</span>
            </div>
            <div>
              <p className="text-slate-450 text-xs font-semibold uppercase tracking-wider">Task Progress</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {stats.completed}/{stats.total} goals met
              </p>
            </div>
          </div>
        </div>

        {/* Filter and Control Bar */}
        <div className="backdrop-blur-xl bg-slate-900/30 border border-slate-800/60 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-550 rounded-lg pl-10 pr-4 py-2 transition-all text-sm outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status tabs */}
            <div className="flex p-1 bg-slate-950/80 rounded-lg border border-slate-850">
              <button
                onClick={() => setStatusFilter("all")}
                className={`text-xs px-3.5 py-1.5 rounded-md font-semibold transition-all ${
                  statusFilter === "all"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-205"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`text-xs px-3.5 py-1.5 rounded-md font-semibold transition-all ${
                  statusFilter === "active"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-205"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter("completed")}
                className={`text-xs px-3.5 py-1.5 rounded-md font-semibold transition-all ${
                  statusFilter === "completed"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-205"
                }`}
              >
                Completed
              </button>
            </div>

            {/* Sorting */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "alphabetical")}
              className="bg-slate-950/80 border border-slate-850 text-slate-350 focus:text-white rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Tasks Container */}
        {loading ? (
          /* Loading Skeletor */
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-24 bg-slate-900/20 border border-slate-850 rounded-xl animate-pulse flex flex-col justify-center p-5 space-y-3"
              >
                <div className="h-4 bg-slate-800 w-1/3 rounded"></div>
                <div className="h-3 bg-slate-800 w-2/3 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedTodos.length === 0 ? (
          /* Empty state */
          <div className="backdrop-blur-xl bg-slate-900/10 border border-slate-850 rounded-2xl p-12 text-center shadow-lg">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-500 text-2xl mb-4 border border-slate-800/80">
              ☕
            </div>
            <h3 className="text-lg font-bold text-white">No tasks match the filter</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
              {todos.length === 0
                ? "You haven't added any goals yet. Get started by creating your first task!"
                : "Try relaxing your search terms or changing your status filter tabs."}
            </p>
            {todos.length === 0 && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="mt-5 inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md transition-all duration-150"
              >
                Create First Task
              </button>
            )}
          </div>
        ) : (
          /* Task List */
          <div className="grid grid-cols-1 gap-3.5">
            {filteredAndSortedTodos.map((todo) => (
              <div
                key={todo.id}
                className={`backdrop-blur-xl bg-slate-900/40 border rounded-xl p-5 shadow-xl transition-all duration-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${
                  todo.completed
                    ? "border-slate-900/40 opacity-75"
                    : "border-slate-800/80 hover:border-slate-700/60"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Custom Checkbox Toggle Button */}
                  <button
                    onClick={() => handleToggleComplete(todo)}
                    className={`mt-1.5 w-5 h-5 flex items-center justify-center rounded-md border text-[10px] font-extrabold transition-all duration-150 shrink-0 ${
                      todo.completed
                        ? "bg-indigo-500 border-indigo-500 text-white"
                        : "border-slate-600 hover:border-indigo-400"
                    }`}
                  >
                    {todo.completed && "✓"}
                  </button>

                  <div className="space-y-1">
                    <h3
                      className={`text-base font-bold text-white transition-all ${
                        todo.completed ? "line-through text-slate-500" : ""
                      }`}
                    >
                      {todo.title}
                    </h3>
                    {todo.description && (
                      <p
                        className={`text-sm text-slate-400 break-words max-w-2xl ${
                          todo.completed ? "line-through text-slate-500" : ""
                        }`}
                      >
                        {todo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-[10px] font-semibold bg-slate-950 px-2 py-0.5 rounded text-slate-500 border border-slate-850">
                        {new Date(todo.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {todo.completed ? (
                        <span className="text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                          Done
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 sm:border-l sm:border-slate-850 sm:pl-5 shrink-0">
                  <button
                    onClick={() => startEdit(todo)}
                    className="p-2 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-white transition-all"
                    title="Edit Task"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="p-2 rounded-lg bg-slate-950 hover:bg-rose-950 border border-slate-850 hover:border-rose-900/60 text-slate-400 hover:text-rose-400 transition-all"
                    title="Delete Task"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800/80 rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-4">Create New Task</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Task title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850 text-slate-100 placeholder-slate-655 rounded-lg py-2 px-3.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Describe your goal..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950/60 border border-slate-850 text-slate-100 placeholder-slate-655 rounded-lg py-2 px-3.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm resize-none"
                />
              </div>

              {createError && (
                <div className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded p-2 text-center font-medium">
                  {createError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="bg-slate-950 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-850 text-xs font-bold px-4 py-2 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-gradient-to-r from-indigo-500 to-purple-650 hover:from-indigo-650 hover:to-purple-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                >
                  {isCreating ? "Adding..." : "Add Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingTodo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800/80 rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-4">Edit Task</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Task title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850 text-slate-100 placeholder-slate-655 rounded-lg py-2 px-3.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Describe your goal..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950/60 border border-slate-850 text-slate-100 placeholder-slate-655 rounded-lg py-2 px-3.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm resize-none"
                />
              </div>

              {/* Edit Completed state */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditCompleted(!editCompleted)}
                  className={`w-5 h-5 flex items-center justify-center rounded-md border text-[10px] font-extrabold transition-all duration-150 shrink-0 ${
                    editCompleted
                      ? "bg-indigo-500 border-indigo-500 text-white"
                      : "border-slate-600 hover:border-indigo-400"
                  }`}
                >
                  {editCompleted && "✓"}
                </button>
                <span className="text-sm text-slate-350 select-none">Mark as Completed</span>
              </div>

              {editError && (
                <div className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded p-2 text-center font-medium">
                  {editError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTodo(null)}
                  className="bg-slate-950 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-850 text-xs font-bold px-4 py-2 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-gradient-to-r from-indigo-500 to-purple-650 hover:from-indigo-650 hover:to-purple-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                >
                  {isUpdating ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
