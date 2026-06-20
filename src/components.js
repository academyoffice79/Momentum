import {
  addDays,
  completionForecast,
  formatDate,
  formatTime,
  getProjectHealth,
  hoursBetween,
  now,
  projectProgress,
  recommendedTask,
  remainingHours,
  scheduledHours,
  startOfWeek,
  todayBlocks,
  unscheduledTasks,
} from "./analytics.js";

const html = String.raw;

export const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const icon = (name) => {
  const paths = {
    dashboard: "M4 13h7V4H4v9Zm9 7h7V4h-7v16ZM4 20h7v-5H4v5Z",
    project: "M4 6h16M4 12h10M4 18h16",
    task: "m5 12 4 4L19 6",
    calendar: "M7 2v4M17 2v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
    focus: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
    chart: "M4 19V5M8 17v-6M13 17V7M18 17v-9",
    plus: "M12 5v14M5 12h14",
    play: "M8 5v14l11-7-11-7Z",
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="${paths[name] || paths.task}"/></svg>`;
};

export const appShell = (state, activeView, content) => html`
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-mark">M</span>
      <div>
        <strong>Momentum</strong>
        <small>Goal-driven planning</small>
      </div>
    </div>
    <nav class="nav">
      ${[
    ["dashboard", "Home", "dashboard"],
    ["projects", "Projects", "project"],
    ["planning", "Week Planner", "calendar"],
    ["focus", "Today", "focus"],
    ["analytics", "Insights", "chart"],
  ]
    .map(
      ([view, label, glyph]) => html`
            <button class="nav-item ${activeView === view ? "active" : ""}" data-view="${view}" title="${label}">
              ${icon(glyph)}<span>${label}</span>
            </button>
          `,
        )
        .join("")}
    </nav>
    <div class="sidebar-summary">
      <span>Weekly capacity</span>
      <strong>${state.settings.weeklyCapacityHours}h</strong>
      <small>${remainingHours(state.tasks)}h remaining across active work</small>
      <div class="mini-actions">
        <button data-action="reset-demo">Demo data</button>
        <button data-action="clear-workspace">Blank</button>
      </div>
    </div>
  </aside>
  <main class="main">${content}</main>
`;

export const renderDashboard = (state) => {
  const weekStart = startOfWeek();
  const weekEnd = addDays(weekStart, 7);
  const committed = scheduledHours(state.blocks, weekStart, weekEnd);
  const openTasks = state.tasks.filter((task) => task.status !== "Done");
  const rec = recommendedTask(state.tasks, state.blocks);
  const recProject = rec ? state.projects.find((project) => project.id === rec.projectId) : null;
  const upcoming = [...state.tasks]
    .filter((task) => task.status !== "Done")
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  return html`
    <header class="topbar">
      <div>
        <p class="eyebrow">Today is ${formatDate(now(), { weekday: "long", month: "short", day: "numeric" })}</p>
        <h1>What should I work on right now?</h1>
      </div>
      <button class="primary-action" data-action="auto-schedule">${icon("play")} Auto-schedule backlog</button>
    </header>
    <section class="answer-band">
      <div>
        <span class="label"> Current Focus </span>
        <h2> ${recProject ? escapeHtml(recProject.name) : "Everything scheduled"} </h2>
        <p> ${rec ? `Next task: ${escapeHtml(rec.title)}` : "Your active work is in good shape."}</p>
        <p>${rec ? `${taskRemaining(rec)}h remaining before ${formatDate(rec.deadline)}` : "Your active work is in good shape."}</p>
      </div>
      <div class="capacity-ring" style="--fill:${Math.min(100, (committed / state.settings.weeklyCapacityHours) * 100)}">
        <strong>${committed}h</strong>
        <span>committed</span>
      </div>
    </section>
    <section class="metrics-grid">
      <article class="metric"><span>Active projects</span><strong>${state.projects.length}</strong><small>${openTasks.length} open tasks</small></article>
      <article class="metric"><span>Remaining work</span><strong>${remainingHours(state.tasks)}h</strong><small>estimated minus logged</small></article>
      <article class="metric"><span>Capacity load</span><strong>${Math.round((committed / state.settings.weeklyCapacityHours) * 100)}%</strong><small>${state.settings.weeklyCapacityHours - committed}h open this week</small></article>
      <article class="metric"><span>Unscheduled</span><strong>${unscheduledTasks(state.tasks, state.blocks).length}</strong><small>tasks need time blocks</small></article>
    </section>
    <section class="dashboard-grid">
      <div class="panel">
        <div class="section-title"><h2>Project Health</h2><span>Forecasts and risk</span></div>
        <div class="project-stack">
          ${state.projects
            .map((project) => {
              const health = getProjectHealth(project, state.tasks, state.blocks, state.settings);
              return html`
                <article class="project-row">
                  <span class="color-dot" style="background:${project.color}"></span>
                  <div>
                    <strong>${escapeHtml(project.name)}</strong>
                    <small>${health.remaining}h left, forecast ${formatDate(completionForecast(project, state.tasks, state.settings))}</small>
                  </div>
                  <span class="risk ${health.risk.toLowerCase().replaceAll(" ", "-")}">${health.risk}</span>
                  <meter value="${health.health}" min="0" max="100"></meter>
                </article>
              `;
            })
            .join("")}
        </div>
      </div>
      <div class="panel">
        <div class="section-title"><h2>Today</h2><span>Schedule and deadlines</span></div>
        <div class="agenda-list">
          ${todayBlocks(state.blocks)
            .map((block) => agendaBlock(block, state))
            .join("")}
        </div>
        <div class="deadline-list">
          ${upcoming
            .map((task) => html`<button class="deadline-chip" data-task="${task.id}">${escapeHtml(task.title)} <span>${formatDate(task.deadline)}</span></button>`)
            .join("")}
        </div>
      </div>
    </section>
  `;
};

export const renderProjects = (state) => html`
  <header class="topbar">
    <div><p class="eyebrow">Project Management</p><h1>Outcomes, milestones, timelines</h1></div>
    <div class="toolbar">
      <button class="secondary-action" data-action="toggle-form" data-target="project-form">${icon("plus")} Project</button>
      <button class="primary-action" data-action="toggle-form" data-target="milestone-form">${icon("plus")} Milestone</button>
    </div>
  </header>
  <section class="form-grid">
    <form class="entity-form hidden" data-form="project" id="project-form">
      <label>Name<input name="name" required placeholder="Science fair research" /></label>
      <label>Area<input name="area" placeholder="School, Work, Personal" /></label>
      <label>Deadline<input name="deadline" type="date" required /></label>
      <label>Color<input name="color" type="color" value="#2563eb" /></label>
      <label class="wide">Goal<input name="goal" placeholder="What outcome should this project create?" /></label>
      <button class="primary-action" type="submit">${icon("plus")} Create project</button>
    </form>
    <form class="entity-form hidden" data-form="milestone" id="milestone-form">
      <label>Project<select name="projectId" required>${projectOptions(state)}</select></label>
      <label>Name<input name="name" required placeholder="First draft complete" /></label>
      <label>Due<input name="due" type="date" required /></label>
      <button class="primary-action" type="submit">${icon("plus")} Add milestone</button>
    </form>
  </section>
  <section class="project-board">
    ${state.projects.length
      ? state.projects
      .map((project) => {
        const health = getProjectHealth(project, state.tasks, state.blocks, state.settings);
        const milestones = state.milestones.filter((milestone) => milestone.projectId === project.id);
        const projectTasks = state.tasks.filter((task) => task.projectId === project.id);
        const projectBlocks = state.blocks.filter((block) => block.projectId === project.id);
        const unscheduledTasks = projectTasks.filter((task) => !projectBlocks.some((block) => block.taskId === task.id));
        return html`
          <article class="project-card" data-action="open-project" data-project="${project.id}">
            <div class="project-card-head">
              <span class="color-dot" style="background:${project.color}"></span>
              <div><h2>${escapeHtml(project.name)}</h2><p>${escapeHtml(project.goal)}</p></div>
              <div class="card-actions">
                <span class="health-score">${health.health}</span>
                <button class="icon-button danger" data-action="delete-project" data-project="${project.id}" title="Delete project">×</button>
              </div>
            </div>
            <div class="progress-line"><span style="width:${projectProgress(project, state.tasks)}%; background:${project.color}"></span></div>
            <div class="project-meta">
              <span>${projectProgress(project, state.tasks)}% progress</span>
              <span>${health.remaining}h remaining</span>
              <span>Due ${formatDate(project.deadline)}</span>
            </div>
            <div class="timeline">
              ${milestones
                .map((milestone) => {
                  const done = (state.tasks.filter((task) => task.milestoneId === milestone.id)).filter((task) => task.status === "Done").length;
                  return html`
                    <div class="timeline-item">
                      <span></span>
                      <div><strong>${escapeHtml(milestone.name)}</strong><small>${done}/${(state.tasks.filter((task) => task.milestoneId === milestone.id)).length} tasks, due ${formatDate(milestone.due)}</small></div>
                    </div>
                  `;
                })
                .join("")}
            </div>
            <div class="project-work">
              <h3>Upcoming Work Sessions</h3>
              ${
                projectBlocks.length
                  ? projectBlocks
                      .slice(0, 5)
                      .map((block) => {
                        const task = state.tasks.find((t) => t.id === block.taskId);
                        const projectName = project.name;

                        return html`
                          <div class="timeline-item">
                            <span></span>
                            <div>
                              <strong>${task?.title || "Unknown Task"}</strong>
                              <small>${projectName}</small>
                            </div>
                          </div>
                        `;
                      })
                      .join("")
                  : "<p>No scheduled work sessions</p>"
              }
            </div>

            <div class="project-work">
              <h3>Needs Scheduling</h3>
              ${
                unscheduledTasks.length
                  ? unscheduledTasks
                      .map((task) => html`
                          <div class="timeline-item">
                            <span></span>
                            <div>
                              <strong>${task.title}</strong>
                            </div>
                          </div>
                        `)
                      .join("")
                  : "<p>Everything is scheduled</p>"
              }
            </div>
          </article>
        `;
      })
      .join("")
      : emptyState("No projects yet", "Create a project to start turning a long-term goal into milestones, tasks, and scheduled work.")}
  </section>
`;

export const renderTasks = (state) => html`
  <header class="topbar">
    <div><p class="eyebrow">Task Management</p><h1>Prioritize, estimate, unblock, schedule</h1></div>
    <button class="primary-action" data-action="toggle-form" data-target="task-form">${icon("plus")} New task</button>
  </header>
  <section class="task-layout">
    <form class="task-form hidden" data-form="task" id="task-form">
      <label>Title<input name="title" required placeholder="Write documentation" /></label>
      <label>Project<select name="projectId" required>${projectOptions(state)}</select></label>
      <label>Milestone<select name="milestoneId">${milestoneOptions(state)}</select></label>
      <label>Priority<select name="priority"><option>High</option><option selected>Medium</option><option>Low</option></select></label>
      <label>Estimate hours<input name="estimate" type="number" min="0.5" step="0.5" value="1.5" /></label>
      <label>Deadline<input name="deadline" type="date" required /></label>
      <label>Tags<input name="tags" placeholder="coding, writing" /></label>
      <label>Depends on<select name="dependencies"><option value="">None</option>${taskOptions(state)}</select></label>
      <button class="primary-action" type="submit">${icon("plus")} Add task</button>
    </form>
    <div class="task-table">
      ${state.tasks.length
        ? state.tasks
        .map((task) => {
          const project = state.projects.find((item) => item.id === task.projectId);
          const blocked = task.dependencies.some((dep) => state.tasks.find((item) => item.id === dep)?.status !== "Done");
          const scheduled = state.blocks.some((block) => block.taskId === task.id);
          return html`
            <article class="task-row" draggable="true" data-drag-task="${task.id}">
              <span class="color-dot" style="background:${project?.color}"></span>
              <div class="task-main">
                <strong>${escapeHtml(task.title)}</strong>
                <small>${escapeHtml(project?.name || "No project")} ${task.tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("")}</small>
              </div>
              <span class="priority ${task.priority.toLowerCase()}">${task.priority}</span>
              <span>${task.estimate}h est</span>
              <label class="compact-field">Actual<input data-action="update-task" data-task="${task.id}" data-field="actual" type="number" min="0" step="0.25" value="${task.actual}" /></label>
              <label class="compact-field">Progress<input data-action="update-task" data-task="${task.id}" data-field="progress" type="number" min="0" max="100" step="5" value="${task.progress}" /></label>
              <span>${formatDate(task.deadline)}</span>
              <select class="status-select" data-action="update-task" data-task="${task.id}" data-field="status">
                ${["Todo", "In Progress", "Done"].map((status) => `<option ${status === task.status ? "selected" : ""}>${status}</option>`).join("")}
              </select>
              <button class="icon-button" data-action="schedule-task" data-task="${task.id}" title="Schedule next open block">${icon("calendar")}</button>
              <button class="icon-button danger" data-action="delete-task" data-task="${task.id}" title="Delete task">×</button>
              <small class="${blocked ? "blocked" : scheduled ? "scheduled" : "unscheduled"}">${blocked ? "Blocked" : scheduled ? "Scheduled" : "Needs block"}</small>
            </article>
          `;
        })
        .join("")
        : emptyState("No tasks yet", "Create tasks with estimates and deadlines, then schedule them into calendar blocks.")}
    </div>
  </section>
`;

export const renderCalendar = (state, mode = "week") => html`
  <header class="topbar">
    <div><p class="eyebrow">Calendar</p><h1>Time blocks and commitments</h1></div>
    <div class="toolbar">
      <button class="secondary-action" data-action="toggle-form" data-target="event-form">${icon("plus")} Event</button>
      <div class="segmented">
        <button class="${mode === "week" ? "active" : ""}" data-calendar-mode="week">Week</button>
        <button class="${mode === "month" ? "active" : ""}" data-calendar-mode="month">Month</button>
      </div>
    </div>
  </header>
  <form class="entity-form hidden" data-form="event" id="event-form">
    <label>Title<input name="title" required placeholder="Class, workout, appointment" /></label>
    <label>Start<input name="start" type="datetime-local" required /></label>
    <label>End<input name="end" type="datetime-local" required /></label>
    <label>Color<input name="color" type="color" value="#2563eb" /></label>
    <button class="primary-action" type="submit">${icon("plus")} Add event</button>
  </form>
  ${mode === "month" ? renderMonth(state) : renderWeek(state)}
`;

export const renderPlanning = (state) => html`
  <header class="topbar">
    <div><p class="eyebrow">Weekly Planning</p><h1>Drag unscheduled tasks into real time</h1></div>
    <button class="primary-action" data-action="auto-schedule">${icon("play")} Fill best slots</button>
  </header>
  <section class="planning-layout">
    <aside class="backlog">
      <div class="section-title"><h2>Unscheduled</h2><span>${unscheduledTasks(state.tasks, state.blocks).length} tasks</span></div>
      ${unscheduledTasks(state.tasks, state.blocks).length
        ? unscheduledTasks(state.tasks, state.blocks)
        .map((task) => taskCard(task, state))
        .join("")
        : emptyState("All tasks are scheduled", "Create another task or move to Daily Focus to work today's plan.")}
    </aside>
    <div>${renderWeek(state)}</div>
  </section>
`;

export const renderFocus = (state) => {
  const blocks = todayBlocks(state.blocks);
  const next = recommendedTask(state.tasks, state.blocks);
  return html`
    <header class="focus-head">
      <p class="eyebrow">Daily Focus</p>
      <h1>${next ? escapeHtml(next.title) : "No active work due today"}</h1>
      <p>${next ? `${next.priority} priority, ${taskRemaining(next)}h remaining, due ${formatDate(next.deadline)}` : "Use the weekly planner to create the next work session."}</p>
    </header>
    <section class="focus-grid">
      ${blocks
        .length
        ? blocks
        .map(
          (block) => html`
            <article class="focus-block">
              <span>${formatTime(block.start)} - ${formatTime(block.end)}</span>
              <h2>${escapeHtml(block.title)}</h2>
              <p>${block.type === "task" ? "Task work session" : "Personal event"}</p>
              ${block.taskId
                ? html`<div class="log-actions">
                    <button data-action="log-block" data-block="${block.id}" data-outcome="Yes">Done</button>
                    <button data-action="log-block" data-block="${block.id}" data-outcome="Partially">Partial</button>
                    <button data-action="log-block" data-block="${block.id}" data-outcome="No">Missed</button>
                  </div>`
                : ""}
            </article>
          `,
        )
        .join("")
        : emptyState("No time blocks today", "Schedule a task or add a personal event to build today's focus list.")}
    </section>
  `;
};

export const renderAnalytics = (state) => {
  const weekStart = startOfWeek();
  const committed = scheduledHours(state.blocks, weekStart, addDays(weekStart, 7));
  const completedActual = state.tasks.reduce((sum, task) => sum + task.actual, 0);
  const completedEstimate = state.tasks.reduce((sum, task) => sum + Math.min(task.actual, task.estimate), 0);
  const bias = completedEstimate ? Math.round(((completedActual - completedEstimate) / completedEstimate) * 100) : 0;
  return html`
    <header class="topbar">
      <div><p class="eyebrow">Insights</p><h1>Capacity, forecasts, and time accuracy</h1></div>
    </header>
    <section class="insight-grid">
      <article class="insight-panel"><h2>Capacity Analysis</h2><strong>${committed}/${state.settings.weeklyCapacityHours}h</strong><p>${state.settings.weeklyCapacityHours - committed} hours remain available this week.</p></article>
      <article class="insight-panel"><h2>Estimation Pattern</h2><strong>${bias > 0 ? "+" : ""}${bias}%</strong><p>You are currently logging ${Math.abs(bias)}% ${bias >= 0 ? "more" : "less"} time than estimated on active tasks.</p></article>
      <article class="insight-panel"><h2>Deadline Risk</h2><strong>${state.projects.filter((project) => getProjectHealth(project, state.tasks, state.blocks, state.settings).risk !== "On Track").length}</strong><p>Projects need attention based on remaining work and available capacity.</p></article>
    </section>
    <section class="panel">
      <div class="section-title"><h2>Project Forecasts</h2><span>Based on remaining estimates and current capacity</span></div>
      ${state.projects
        .map((project) => {
          const health = getProjectHealth(project, state.tasks, state.blocks, state.settings);
          return html`
            <div class="forecast-row">
              <span class="color-dot" style="background:${project.color}"></span>
              <strong>${escapeHtml(project.name)}</strong>
              <span>Forecast ${formatDate(completionForecast(project, state.tasks, state.settings))}</span>
              <span>Deadline ${formatDate(project.deadline)}</span>
              <span class="risk ${health.risk.toLowerCase().replaceAll(" ", "-")}">${health.risk}</span>
            </div>
          `;
        })
        .join("")}
    </section>
  `;
};

const agendaBlock = (block, state) => {
  const project = state.projects.find((item) => item.id === block.projectId);
  return html`
    <article class="agenda-item">
      <span class="time">${formatTime(block.start)}</span>
      <span class="color-dot" style="background:${project?.color || block.color || "#2563eb"}"></span>
      <div><strong>${escapeHtml(block.title)}</strong><small>${formatTime(block.start)} - ${formatTime(block.end)}</small></div>
    </article>
  `;
};

const taskCard = (task, state) => {
  const project = state.projects.find((item) => item.id === task.projectId);
  return html`
    <article class="backlog-card" draggable="true" data-drag-task="${task.id}">
      <span class="color-dot" style="background:${project?.color}"></span>
      <strong>${escapeHtml(task.title)}</strong>
      <small>${taskRemaining(task)}h left, due ${formatDate(task.deadline)}</small>
    </article>
  `;
};

const renderWeek = (state) => {
  const start = startOfWeek();
  const hours = Array.from({ length: state.settings.workdayEnd - state.settings.workdayStart }, (_, i) => state.settings.workdayStart + i);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return html`
    <div class="week-calendar">
      <div class="calendar-head-spacer"></div>
      ${days.map((day) => `<div class="day-head"><strong>${formatDate(day, { weekday: "short" })}</strong><span>${formatDate(day)}</span></div>`).join("")}
      ${hours
        .map(
          (hour) => html`
            <div class="hour-label">${hour > 12 ? hour - 12 : hour}:00</div>
            ${days
              .map((day) => {
                const slotStart = new Date(day);
                slotStart.setHours(hour, 0, 0, 0);
                const slotEnd = new Date(slotStart);
                slotEnd.setHours(hour + 1);
                const blocks = state.blocks.filter((block) => new Date(block.start) >= slotStart && new Date(block.start) < slotEnd);
                return html`
                  <div class="time-slot" data-drop-day="${day.toISOString()}" data-drop-hour="${hour}">
                    ${blocks.map((block) => calendarBlock(block, state)).join("")}
                  </div>
                `;
              })
              .join("")}
          `,
        )
        .join("")}
    </div>
  `;
};

const calendarBlock = (block, state) => {
  const project = state.projects.find((item) => item.id === block.projectId);
  const duration = Math.max(1, hoursBetween(block.start, block.end));
  return html`
    <article class="calendar-block ${block.type}" style="--block-color:${project?.color || block.color || "#2563eb"}; min-height:${Math.min(112, 38 * duration)}px" data-block-id="${block.id}">
      <strong>${escapeHtml(block.title)}</strong>
      <span>${formatTime(block.start)} - ${formatTime(block.end)}</span>
      ${block.taskId ? `<button class="resize-handle" data-action="resize-block" data-block="${block.id}" title="Add 30 minutes"></button>` : ""}
      <button class="delete-block" data-action="delete-block" data-block="${block.id}" title="Remove block">×</button>
    </article>
  `;
};

const renderMonth = (state) => {
  const first = new Date(now());
  first.setDate(1);
  first.setHours(0, 0, 0, 0);
  const gridStart = startOfWeek(first);
  const days = Array.from({ length: 35 }, (_, index) => addDays(gridStart, index));
  return html`
    <div class="month-grid">
      ${days
        .map((day) => {
          const dayEnd = addDays(day, 1);
          const blocks = state.blocks.filter((block) => new Date(block.start) >= day && new Date(block.start) < dayEnd);
          return html`
            <div class="month-day">
              <strong>${formatDate(day)}</strong>
              ${blocks.slice(0, 3).map((block) => `<span style="border-color:${state.projects.find((project) => project.id === block.projectId)?.color || block.color || "#2563eb"}">${escapeHtml(block.title)}</span>`).join("")}
            </div>
          `;
        })
        .join("")}
    </div>
  `;
};

const projectOptions = (state) =>
  state.projects.map((project) => `<option value="${project.id}">${escapeHtml(project.name)}</option>`).join("");

const milestoneOptions = (state) =>
  [`<option value="">None</option>`, ...state.milestones.map((milestone) => `<option value="${milestone.id}">${escapeHtml(milestone.name)}</option>`)].join("");

const taskOptions = (state) =>
  state.tasks.map((task) => `<option value="${task.id}">${escapeHtml(task.title)}</option>`).join("");

const emptyState = (title, body) => html`
  <div class="empty-state">
    <strong>${title}</strong>
    <p>${body}</p>
  </div>
`;

const taskRemaining = (task) => Number(Math.min(Math.max(0, task.estimate - task.actual), Math.max(0, task.estimate * (1 - task.progress / 100))).toFixed(1));
