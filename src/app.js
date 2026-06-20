import { createStore } from "./store.js";
import {
  addDays,
  now,
  recommendedTask,
  startOfWeek,
  unscheduledTasks,
} from "./analytics.js";
import {
  appShell,
  renderAnalytics,
  renderCalendar,
  renderDashboard,
  renderFocus,
  renderPlanning,
  renderProjects,
  renderTasks,
} from "./components.js";

const store = createStore();
const root = document.querySelector("#app");

const ui = {
  view: "dashboard",
  calendarMode: "week",
  draggedTaskId: null,
};

const views = {
  dashboard: renderDashboard,
  projects: renderProjects,
  planning: renderPlanning,
  focus: renderFocus,
  analytics: renderAnalytics,
};

const render = () => {
  const state = store.getState();
  root.innerHTML = appShell(state, ui.view, views[ui.view](state));
};

store.subscribe(render);
render();

root.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    ui.view = viewButton.dataset.view;
    render();
    return;
  }

  const calendarMode = event.target.closest("[data-calendar-mode]");
  if (calendarMode) {
    ui.calendarMode = calendarMode.dataset.calendarMode;
    render();
    return;
  }

  const action = event.target.closest("[data-action]");
  if (!action) return;

  if (action.dataset.action === "toggle-form") {
    document.getElementById(action.dataset.target)?.classList.toggle("hidden");
  }

  if (action.dataset.action === "reset-demo") {
    store.reset();
    toast("Demo data restored.");
  }

  if (action.dataset.action === "clear-workspace") {
    store.clearWorkspace();
    toast("Workspace cleared. Start with your own projects.");
  }

  if (action.dataset.action === "schedule-task") {
    scheduleTask(action.dataset.task);
  }

  if (action.dataset.action === "auto-schedule") {
    autoSchedule();
  }

  if (action.dataset.action === "resize-block") {
    const state = store.getState();
    const block = state.blocks.find((item) => item.id === action.dataset.block);
    if (block) {
      const end = new Date(block.end);
      end.setMinutes(end.getMinutes() + 30);
      store.updateBlock(block.id, { end: end.toISOString() });
    }
  }

  if (action.dataset.action === "delete-block") {
    store.deleteBlock(action.dataset.block);
    toast("Time block removed.");
  }

  if (action.dataset.action === "delete-task") {
    store.deleteTask(action.dataset.task);
    toast("Task deleted.");
  }

  if (action.dataset.action === "delete-project") {
    store.deleteProject(action.dataset.project);
    toast("Project and related work deleted.");
  }

  if (action.dataset.action === "log-block") {
    store.logBlock(action.dataset.block, action.dataset.outcome);
  }
});

root.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-form]");
  if (!form) return;
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));

  if (form.dataset.form === "project") {
    store.addProject(data);
  }

  if (form.dataset.form === "milestone") {
    store.addMilestone(data);
  }

  if (form.dataset.form === "task") {
    if (data.dependencies) data.dependencies = [data.dependencies];
    store.addTask(data);
  }

  if (form.dataset.form === "event") {
    if (new Date(data.end) <= new Date(data.start)) {
      toast("Event end time must be after the start time.");
      return;
    }
    store.addEvent(data);
  }

  form.reset();
  form.classList.add("hidden");
  toast("Saved.");
});

root.addEventListener("change", (event) => {
  const control = event.target.closest("[data-action='update-task']");
  if (!control) return;
  store.updateTask(control.dataset.task, { [control.dataset.field]: control.value });
});

root.addEventListener("focusout", (event) => {
  const control = event.target.closest("input[data-action='update-task']");
  if (!control) return;
  store.updateTask(control.dataset.task, { [control.dataset.field]: control.value });
});

root.addEventListener("dragstart", (event) => {
  const card = event.target.closest("[data-drag-task]");
  if (!card) return;
  ui.draggedTaskId = card.dataset.dragTask;
  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData("text/plain", ui.draggedTaskId);
});

root.addEventListener("dragover", (event) => {
  const slot = event.target.closest("[data-drop-day]");
  if (!slot) return;
  event.preventDefault();
  slot.classList.add("drop-ready");
});

root.addEventListener("dragleave", (event) => {
  event.target.closest("[data-drop-day]")?.classList.remove("drop-ready");
});

root.addEventListener("drop", (event) => {
  const slot = event.target.closest("[data-drop-day]");
  if (!slot) return;
  event.preventDefault();
  slot.classList.remove("drop-ready");
  const taskId = event.dataTransfer.getData("text/plain") || ui.draggedTaskId;
  createBlockFromSlot(taskId, new Date(slot.dataset.dropDay), Number(slot.dataset.dropHour));
});

const createBlockFromSlot = (taskId, day, hour) => {
  const state = store.getState();
  const task = state.tasks.find((item) => item.id === taskId);
  const project = state.projects.find((item) => item.id === task?.projectId);
  if (!task || task.status === "Done") return;

  if (isBlocked(task, state.tasks)) {
    toast("This task depends on unfinished work.");
    return;
  }

  const start = new Date(day);
  start.setHours(hour, 0, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + Math.min(120, Math.max(30, (task.estimate - task.actual) * 60)));
  store.addBlock({
    taskId: task.id,
    projectId: task.projectId,
    type: "task",
    title: task.title,
    start: start.toISOString(),
    end: end.toISOString(),
  });
  toast(`Scheduled ${task.title}${project ? ` for ${project.name}` : ""}.`);
};

const scheduleTask = (taskId) => {
  const state = store.getState();
  const start = startOfWeek(now());
  const target = addDays(start, 4);
  target.setHours(state.settings.focusWindowStart, 0, 0, 0);
  createBlockFromSlot(taskId, target, state.settings.focusWindowStart);
};

const autoSchedule = () => {
  const state = store.getState();
  const backlog = unscheduledTasks(state.tasks, state.blocks)
    .filter((task) => !isBlocked(task, state.tasks))
    .slice(0, 5);
  const week = startOfWeek(now());
  const slots = [
    [0, 16],
    [1, 17],
    [2, 16],
    [3, 19],
    [4, 16],
  ];

  backlog.forEach((task, index) => {
    const [dayOffset, hour] = slots[index % slots.length];
    createBlockFromSlot(task.id, addDays(week, dayOffset), hour);
  });

  if (!backlog.length) {
    const next = recommendedTask(state.tasks, state.blocks);
    if (next) scheduleTask(next.id);
    if (!next) toast("No schedulable tasks need new blocks.");
  }
};

const isBlocked = (task, tasks) => task.dependencies.some((dep) => tasks.find((item) => item.id === dep)?.status !== "Done");

const toast = (message) => {
  const existing = document.querySelector(".toast");
  existing?.remove();
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.append(node);
  setTimeout(() => node.remove(), 2600);
};
