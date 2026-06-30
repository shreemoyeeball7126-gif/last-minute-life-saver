import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Hourglass, 
  AlertTriangle, 
  ListCheck, 
  Flame, 
  Calendar, 
  RefreshCw,
  TrendingUp,
  X,
  Check,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Task, SubStep } from "./types";

// Dynamic preset ideas for fast user onboarding
const TASK_PRESETS = [
  { title: "Complete Physics Lab Report", hoursFromNow: 4 },
  { title: "Prepare Slide Deck for Team Pitch", hoursFromNow: 8 },
  { title: "Review React Code & Deploy App", hoursFromNow: 1.5 },
  { title: "Submit Tax Return Documents", hoursFromNow: 25 },
];

const LOADING_MESSAGES = [
  "Bribing the clock to slow down...",
  "Distilling panic into 3 to 5 actionable steps...",
  "Assembling emergency executive function...",
  "Negotiating with procrastination impulses...",
  "Translating deadline stress into hyper-focus...",
  "Formulating your absolute best path forward..."
];

export default function App() {
  // State for Tasks
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("last_minute_lifesaver_tasks");
    return saved ? JSON.parse(saved) : [];
  });

  // State for Form
  const [title, setTitle] = useState("");
  // Default to 4 hours from now
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 4);
    // Format to yyyy-MM-ddThh:mm for local datetime picker
    const tzoffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
    return localISOTime;
  });

  // UI States
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  
  // Tick state to update countdowns every second
  const [now, setNow] = useState(new Date());

  // Save to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem("last_minute_lifesaver_tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cycle loading messages during API calls
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      let idx = 0;
      interval = setInterval(() => {
        idx = (idx + 1) % LOADING_MESSAGES.length;
        setLoadingMessage(LOADING_MESSAGES[idx]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Handle preset clicks
  const applyPreset = (preset: typeof TASK_PRESETS[0]) => {
    setTitle(preset.title);
    const d = new Date();
    d.setMinutes(d.getMinutes() + Math.round(preset.hoursFromNow * 60));
    const tzoffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
    setDeadline(localISOTime);
  };

  // Calculate Urgency Status & Time Left
  const getTaskUrgency = (targetDateStr: string) => {
    const target = new Date(targetDateStr).getTime();
    const current = now.getTime();
    const diffMs = target - current;

    if (diffMs <= 0) {
      return {
        color: "red",
        text: "OVERDUE",
        hoursLeft: 0,
        badgeBg: "bg-red-500/15 border-red-500/30 text-red-400 shadow-lg shadow-red-500/10 animate-pulse",
        borderGlow: "shadow-[0_0_15px_rgba(239,68,68,0.25)] border-red-500/40"
      };
    }

    const hours = diffMs / (1000 * 60 * 60);

    if (hours < 6) {
      return {
        color: "red",
        text: "CRITICAL (<6h)",
        hoursLeft: hours,
        badgeBg: "bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-lg shadow-rose-500/10 animate-pulse",
        borderGlow: "shadow-[0_0_15px_rgba(244,63,94,0.2)] border-rose-500/40"
      };
    } else if (hours < 24) {
      return {
        color: "yellow",
        text: "URGENT (<24h)",
        hoursLeft: hours,
        badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-md shadow-amber-500/5",
        borderGlow: "shadow-[0_0_15px_rgba(245,158,11,0.1)] border-amber-500/30"
      };
    } else {
      return {
        color: "green",
        text: "STABLE",
        hoursLeft: hours,
        badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
        borderGlow: "border-slate-800"
      };
    }
  };

  // Helper to get remaining time string
  const getRemainingTimeString = (targetDateStr: string) => {
    const diff = new Date(targetDateStr).getTime() - now.getTime();
    if (diff <= 0) return "Panic time: Overdue!";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${mins}m`);
    parts.push(`${secs}s`);

    return parts.join(" ");
  };

  // Create task with AI breakdown
  const handleAddTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, deadline }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to parse sub-steps with AI");
      }

      const data = await response.json();
      
      const newSubSteps: SubStep[] = (data.steps || []).map((step: any, index: number) => ({
        id: `step-${Date.now()}-${index}`,
        title: step.title || step.step || `Action item ${index + 1}`,
        duration: Number(step.duration) || 15,
        done: false
      }));

      // If for any reason AI returned no steps, supply a couple of default ones safely
      if (newSubSteps.length === 0) {
        newSubSteps.push(
          { id: `step-${Date.now()}-1`, title: "Assess immediate deliverables", duration: 15, done: false },
          { id: `step-${Date.now()}-2`, title: "Execute core project components", duration: 60, done: false },
          { id: `step-${Date.now()}-3`, title: "Submit and review final outputs", duration: 15, done: false }
        );
      }

      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: title.trim(),
        deadline: new Date(deadline).toISOString(),
        subSteps: newSubSteps,
        createdAt: new Date().toISOString()
      };

      setTasks(prev => {
        const updated = [...prev, newTask];
        // Automatically expand the newly created task
        setExpandedTasks(exp => ({ ...exp, [newTask.id]: true }));
        return updated;
      });

      // Clear input
      setTitle("");
      // Reset default deadline to 4 hours from now for the next task
      const nextD = new Date();
      nextD.setHours(nextD.getHours() + 4);
      const tzoffset = nextD.getTimezoneOffset() * 60000;
      setDeadline(new Date(nextD.getTime() - tzoffset).toISOString().slice(0, 16));

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An unexpected error occurred while generating steps.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle sub-step checkbox
  const toggleSubStep = (taskId: string, stepId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          subSteps: task.map(step => step.id === stepId ? { ...step, done: !step.done } : step)
        };
      }
      return task;
    }));
  };

  // Helper method to work around React state mapping type error in newer TS
  const setTasksSubStepDone = (taskId: string, stepId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedSteps = t.subSteps.map(s => {
          if (s.id === stepId) {
            return { ...s, done: !s.done };
          }
          return s;
        });
        return { ...t, subSteps: updatedSteps };
      }
      return t;
    }));
  };

  // Delete Task
  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setExpandedTasks(prev => {
      const copy = { ...prev };
      delete copy[taskId];
      return copy;
    });
  };

  // Toggle task details expanded
  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // Clear all tasks
  const clearAllTasks = () => {
    if (window.confirm("Are you sure you want to clear all tasks?")) {
      setTasks([]);
      setExpandedTasks({});
    }
  };

  // Sorting: Most urgent deadline first
  // Overdue first, then sorted by remaining hours left
  const sortedTasks = [...tasks].sort((a, b) => {
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  // Overall statistics
  const totalTasksCount = tasks.length;
  const criticalTasksCount = tasks.filter(t => {
    const u = getTaskUrgency(t.deadline);
    return u.color === "red";
  }).length;
  const completedSubsteps = tasks.reduce((sum, t) => sum + t.subSteps.filter(s => s.done).length, 0);
  const totalSubsteps = tasks.reduce((sum, t) => sum + t.subSteps.length, 0);
  const totalEstimatedMinutesLeft = tasks.reduce((sum, t) => {
    const uncompleted = t.subSteps.filter(s => !s.done);
    return sum + uncompleted.reduce((sSum, s) => sSum + s.duration, 0);
  }, 0);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-zinc-100 selection:text-black" id="app-root">
      
      {/* LEFT SIDEBAR: Creation Desk */}
      <aside className="w-full md:w-90 shrink-0 border-b md:border-b-0 md:border-r border-[#222222] p-8 flex flex-col gap-8 bg-[#050505] relative z-25">
        <div className="space-y-2">
          <h1 className="serif italic text-4xl leading-tight text-white tracking-tight">
            The<br />Last-Minute<br />Life Saver
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
            Deadline Management AI
          </p>
        </div>

        {/* Task Form */}
        <div className="space-y-6 flex-1">
          <form onSubmit={handleAddTask} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="task-title" className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">
                New Objective
              </label>
              <input
                id="task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title..."
                required
                className="w-full bg-[#111] border border-[#333] p-3 text-sm rounded focus:outline-none focus:border-zinc-500 text-white placeholder-zinc-700 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="task-deadline" className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">
                Critical Deadline
              </label>
              <input
                id="task-deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full bg-[#111] border border-[#333] p-3 text-sm rounded focus:outline-none focus:border-zinc-500 text-white transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="w-full bg-white text-black font-bold py-4 text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors rounded cursor-pointer flex items-center justify-center gap-2"
              id="btn-submit-task"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Configuring AI Breakdown...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Initialize AI Breakdown</span>
                </>
              )}
            </button>
          </form>

          {/* Stress clock & stats */}
          <div className="pt-6 border-t border-[#222] space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500 uppercase tracking-wider">Stress Clock:</span>
              <span className="text-zinc-300 font-semibold">{now.toLocaleTimeString()}</span>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2 pt-2">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block">
                Quick-start Presets
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {TASK_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="text-left bg-[#111]/60 hover:bg-[#111] border border-[#222] hover:border-[#333] p-2.5 rounded text-xs transition-colors cursor-pointer group"
                  >
                    <div className="font-semibold text-zinc-300 group-hover:text-white truncate">{p.title}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">Due in {p.hoursFromNow}h</div>
                  </button>
                ))}
              </div>
            </div>

            {tasks.length > 0 && (
              <button
                onClick={clearAllTasks}
                className="w-full border border-[#222] hover:border-red-900/40 hover:text-red-400 text-zinc-500 text-[10px] font-bold py-2 uppercase tracking-widest transition-colors rounded cursor-pointer"
                id="btn-clear-all"
              >
                Clear Queue
              </button>
            )}
          </div>
        </div>

        <div className="text-[10px] text-zinc-600 italic mt-auto pt-4 border-t border-[#111]">
          Current Session: Precise & Productive
        </div>

        {/* Form Loading Backdrop Loader overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
            <RefreshCw className="w-8 h-8 text-white animate-spin mb-4" />
            <h3 className="font-serif text-lg text-white italic">Defragmenting Chaos</h3>
            <p className="text-xs text-zinc-400 font-mono mt-2 animate-pulse max-w-xs leading-relaxed">
              "{loadingMessage}"
            </p>
          </div>
        )}
      </aside>

      {/* RIGHT CONTENT PANE: Active Queue */}
      <main className="flex-1 min-h-screen p-6 md:p-10 flex flex-col overflow-y-auto relative z-10" id="app-main">
        
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-10 pb-6 border-b border-[#222]">
          <div className="space-y-1">
            <h2 className="text-4xl serif text-white">Active Queue</h2>
            <p className="text-sm text-zinc-500">Priority sequencing by temporal proximity</p>
          </div>
          
          <div className="flex gap-4 text-[10px] uppercase tracking-widest font-bold text-zinc-400 shrink-0">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500"></div> Critical (&lt;6h)
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div> Urgent (&lt;24h)
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500"></div> Stable
            </span>
          </div>
        </header>

        {/* Statistics Grid */}
        {tasks.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" id="stats-grid">
            <div className="glass p-4 rounded-lg flex flex-col justify-between">
              <span className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase">PANIC SCORE</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-white">{criticalTasksCount}</span>
                <span className="text-xs text-zinc-500">/ {totalTasksCount} critical</span>
              </div>
            </div>

            <div className="glass p-4 rounded-lg flex flex-col justify-between">
              <span className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase">STEPS COMPLETED</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-zinc-200">
                  {totalSubsteps ? Math.round((completedSubsteps / totalSubsteps) * 100) : 0}%
                </span>
                <span className="text-xs text-zinc-500">({completedSubsteps}/{totalSubsteps})</span>
              </div>
            </div>

            <div className="glass p-4 rounded-lg flex flex-col justify-between">
              <span className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase">EST. CRUNCH TIME</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-white">{totalEstimatedMinutesLeft}</span>
                <span className="text-xs text-zinc-500">mins left</span>
              </div>
            </div>

            <div className="glass p-4 rounded-lg flex flex-col justify-between">
              <span className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase">FLOW EFFICIENCY</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-zinc-200">
                  {tasks.length > 0 ? "Adrenaline" : "Stagnant"}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Live Mode</span>
              </div>
            </div>
          </div>
        )}

        {/* Active List */}
        {sortedTasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 border border-dashed border-[#222] rounded-lg text-center" id="empty-state">
            <div className="p-4 bg-white/5 rounded-full border border-white/10 mb-4 text-zinc-500">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-serif text-white italic">Clear Skies Ahead</h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto mt-2 leading-relaxed">
              No imminent deadlines on the radar. Add an objective in the creation desk or trigger a preset to initialize your AI roadmap.
            </p>
          </div>
        ) : (
          <div className="space-y-6" id="tasks-list-container">
            <AnimatePresence initial={false}>
              {sortedTasks.map((task) => {
                const urgency = getTaskUrgency(task.deadline);
                const isExpanded = !!expandedTasks[task.id];
                const completedStepsCount = task.subSteps.filter(s => s.done).length;
                const totalStepsCount = task.subSteps.length;
                const completionPercent = totalStepsCount 
                  ? Math.round((completedStepsCount / totalStepsCount) * 100) 
                  : 0;

                const borderClass = 
                  urgency.color === "red" 
                    ? "deadline-red" 
                    : urgency.color === "yellow" 
                    ? "deadline-yellow" 
                    : "deadline-green";

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className={`glass p-6 rounded-lg flex flex-col gap-5 relative transition-all duration-300 ${borderClass}`}
                    id={`task-card-${task.id}`}
                  >
                    
                    {/* Top Row: Title & Countdown */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-1.5">
                        <h3 className="text-xl sm:text-2xl serif text-white tracking-tight leading-tight">
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500">
                          <span className={`uppercase tracking-wider font-bold ${
                            urgency.color === "red" 
                              ? "text-red-400" 
                              : urgency.color === "yellow" 
                              ? "text-yellow-400" 
                              : "text-green-400"
                          }`}>
                            {urgency.text}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(task.deadline).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0 bg-white/2 border border-white/5 rounded px-3.5 py-2">
                        <div className={`font-mono font-bold text-lg leading-none ${
                          urgency.color === "red" 
                            ? "text-red-500 animate-pulse" 
                            : urgency.color === "yellow" 
                            ? "text-yellow-500" 
                            : "text-green-500"
                        }`}>
                          {getRemainingTimeString(task.deadline)}
                        </div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">remaining</div>
                      </div>
                    </div>

                    {/* Quick Stats Summary and Action buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleExpanded(task.id)}
                          className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                          id={`btn-toggle-expand-${task.id}`}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4 text-zinc-500" />
                              <span>Hide Action Plan</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 text-zinc-500" />
                              <span>View Action Plan ({completedStepsCount}/{totalStepsCount})</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-[11px] font-mono text-zinc-500">
                          {completionPercent}% Progress ({completedStepsCount}/{totalStepsCount} steps)
                        </span>

                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-zinc-500 hover:text-red-400 transition-colors p-1.5 bg-white/3 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 rounded cursor-pointer"
                          title="Delete Objective"
                          id={`btn-delete-${task.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#111] h-1 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          completionPercent === 100 
                            ? "bg-zinc-200" 
                            : urgency.color === "red" 
                            ? "bg-red-500" 
                            : urgency.color === "yellow" 
                            ? "bg-yellow-500" 
                            : "bg-green-500"
                        }`}
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>

                    {/* Substeps Action Plan (Collapsible) */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-2 pb-1 space-y-3">
                            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center justify-between pb-1">
                              <span>AI Recommended Sequence</span>
                              <span>Chronological</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {task.subSteps.map((step, idx) => (
                                <div
                                  key={step.id}
                                  onClick={() => setTasksSubStepDone(task.id, step.id)}
                                  className={`p-3.5 rounded border transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                                    step.done 
                                      ? "bg-[#0d0d0d]/40 border-zinc-900 text-zinc-600 opacity-55" 
                                      : "bg-white/5 border-white/8 hover:border-zinc-400 hover:bg-white/10 text-zinc-200"
                                  }`}
                                  id={`step-item-${step.id}`}
                                >
                                  <div className="flex items-start gap-2.5">
                                    <div className={`w-4 h-4 rounded-sm flex items-center justify-center shrink-0 border mt-0.5 transition-all ${
                                      step.done 
                                        ? "bg-white border-white text-black" 
                                        : "border-zinc-500"
                                    }`}>
                                      {step.done && <Check className="w-3 h-3 stroke-[3px]" />}
                                    </div>
                                    <span className={`text-[11px] font-semibold leading-normal ${step.done ? "line-through text-zinc-500" : ""}`}>
                                      {idx + 1}. {step.title}
                                    </span>
                                  </div>

                                  <div className="text-[10px] font-mono text-zinc-500 flex justify-between items-center border-t border-white/5 pt-2">
                                    <span>Estimate</span>
                                    <span>{step.duration} mins</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {completionPercent === 100 && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white/5 border border-white/10 p-4 rounded text-center space-y-1 mt-3"
                              >
                                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                                  <span>Crisis Resolved</span>
                                </div>
                                <p className="text-[10px] text-zinc-500">Every single strategic phase has been completed. Stand ready for immediate delivery.</p>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </main>

    </div>
  );
}

