import { seedData } from "./data.js";

const STORAGE_KEY = "momentum.workspace.v1";

const clone = (value) => JSON.parse(JSON.stringify(value));
const makeId = (prefix) => `${prefix}-${crypto.randomUUID()}`;
const parseTags = (value) =>
  String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const emptyState = () => ({
  settings: clone(seedData.settings),
  projects: [],
  milestones: [],
  tasks: [],
  blocks: [], 
});

export const createStore = () => {
  let state = load();
  const listeners = new Set();

  function load() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return emptyState();
    try {
      return { ...emptyState(), ...JSON.parse(saved) };
    } catch {
      return emptyState();
    }
  }

  function persist(notify = true) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (notify) listeners.forEach((listener) => listener(state));
  }

  function normalizeTaskPatch(patch) {
    const normalized = { ...patch };
    if ("estimate" in normalized) normalized.estimate = Number(normalized.estimate || 0);
    if ("actual" in normalized) normalized.actual = Number(normalized.actual || 0);
    if ("progress" in normalized) normalized.progress = Number(normalized.progress || 0);
    if (normalized.status === "Done") normalized.progress = 100;
    if (normalized.progress >= 100) normalized.status = "Done";
    if (normalized.progress > 0 && normalized.progress < 100 && !normalized.status) normalized.status = "In Progress";
    if ("tags" in normalized && !Array.isArray(normalized.tags)) normalized.tags = parseTags(normalized.tags);
    if ("dependencies" in normalized && !Array.isArray(normalized.dependencies)) {
      normalized.dependencies = String(normalized.dependencies || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    }
    return normalized;
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset() {
      state = clone(seedData);
      persist();
    },
    clearWorkspace() {
      state = emptyState();
      persist();
    },
    updateSettings(patch) {
      state.settings = {
        ...state.settings,
        ...Object.fromEntries(
          Object.entries(patch).map(([key, value]) => [key, Number.isNaN(Number(value)) ? value : Number(value)]),
        ),
      };
      persist();
    },
    addProject(partial) {
      const id = makeId("proj");
      state.projects.push({
        id,
        name: partial.name,
        color: partial.color || "#2563eb",
        deadline: partial.deadline,
        goal: partial.goal || "",
        area: partial.area || "Personal",
      });
      persist();
      return id;
    },
    updateProject(projectId, patch) {
      state.projects = state.projects.map((project) => (project.id === projectId ? { ...project, ...patch } : project));
      persist();
    },
    deleteProject(projectId) {
      const taskIds = new Set(state.tasks.filter((task) => task.projectId === projectId).map((task) => task.id));
      state.projects = state.projects.filter((project) => project.id !== projectId);
      state.milestones = state.milestones.filter((milestone) => milestone.projectId !== projectId);
      state.tasks = state.tasks.filter((task) => task.projectId !== projectId);
      state.blocks = state.blocks.filter((block) => block.projectId !== projectId && !taskIds.has(block.taskId));
      persist();
    },
    addMilestone(partial) {
      const id = makeId("mile");
      state.milestones.push({
        id,
        projectId: partial.projectId,
        name: partial.name,
        due: partial.due,
      });
      persist();
      return id;
    },
    updateMilestone(milestoneId, patch) {
      state.milestones = state.milestones.map((milestone) => (milestone.id === milestoneId ? { ...milestone, ...patch } : milestone));
      persist();
    },
    addTask(partial) {
      const id = makeId("task");
      state.tasks.push({
        id,
        projectId: partial.projectId,
        milestoneId: partial.milestoneId,
        title: partial.title,
        priority: partial.priority || "Medium",
        estimate: Number(partial.estimate || 1),
        actual: 0,
        deadline: partial.deadline,
        status: partial.status || "Todo",
        progress: Number(partial.progress || 0),
        tags: parseTags(partial.tags),
        dependencies: Array.isArray(partial.dependencies)
          ? partial.dependencies.filter(Boolean)
          : String(partial.dependencies || "")
              .split(",")
              .map((id) => id.trim())
              .filter(Boolean),
      });
      persist();
      return id;
    },
    updateTask(taskId, patch) {
      const normalized = normalizeTaskPatch(patch);
      state.tasks = state.tasks.map((task) => (task.id === taskId ? { ...task, ...normalized } : task));
      persist();
    },
    updateTaskDraft(taskId, patch) {
      const normalized = normalizeTaskPatch(patch);
      state.tasks = state.tasks.map((task) => (task.id === taskId ? { ...task, ...normalized } : task));
      persist(false);
    },
    deleteTask(taskId) {
      state.tasks = state.tasks
        .filter((task) => task.id !== taskId)
        .map((task) => ({ ...task, dependencies: task.dependencies.filter((dep) => dep !== taskId) }));
      state.blocks = state.blocks.filter((block) => block.taskId !== taskId);
      persist();
    },
    addBlock(block) {
      state.blocks.push({ id: makeId("block"), ...block });
      persist();
    },
    addEvent(partial) {
      state.blocks.push({
        id: makeId("event"),
        type: "event",
        title: partial.title,
        start: new Date(partial.start).toISOString(),
        end: new Date(partial.end).toISOString(),
        color: partial.color || "#2563eb",
      });
      persist();
    },
    updateBlock(blockId, patch) {
      state.blocks = state.blocks.map((block) => (block.id === blockId ? { ...block, ...patch } : block));
      persist();
    },
    deleteBlock(blockId) {
      state.blocks = state.blocks.filter((block) => block.id !== blockId);
      persist();
    },
    logBlock(blockId, outcome) {
      const block = state.blocks.find((item) => item.id === blockId);
      if (!block || !block.taskId) return;
      const duration = (new Date(block.end) - new Date(block.start)) / 36e5;
      const multiplier = outcome === "Yes" ? 1 : outcome === "Partially" ? 0.55 : 0.15;
      state.tasks = state.tasks.map((task) => {
        if (task.id !== block.taskId) return task;
        const actual = Number((task.actual + duration).toFixed(2));
        const progress = Math.min(100, Math.round(task.progress + (duration / task.estimate) * 100 * multiplier));
        return {
          ...task,
          actual,
          progress,
          status: progress >= 100 ? "Done" : "In Progress",
        };
      });
      state.blocks = state.blocks.map((item) => (item.id === blockId ? { ...item, actual: duration, outcome } : item));
      persist();
    },
  };
};
