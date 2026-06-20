export const now = () => new Date();

export const startOfWeek = (date = now()) => {
  const value = new Date(date);
  const day = value.getDay();
  const diff = value.getDate() - day + (day === 0 ? -6 : 1);
  value.setDate(diff);
  value.setHours(0, 0, 0, 0);
  return value;
};

export const addDays = (date, days) => {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
};

export const hoursBetween = (start, end) => (new Date(end) - new Date(start)) / 36e5;

export const formatTime = (dateLike) =>
  new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(dateLike));

export const formatDate = (dateLike, options = { month: "short", day: "numeric" }) =>
  new Intl.DateTimeFormat("en-US", options).format(new Date(dateLike));

export const projectProgress = (project, tasks) => {
  const projectTasks = tasks.filter((task) => task.projectId === project.id);
  if (!projectTasks.length) return 0;
  return Math.round(projectTasks.reduce((sum, task) => sum + task.progress, 0) / projectTasks.length);
};

export const remainingHours = (tasks) =>
  Number(
    tasks
      .filter((task) => task.status !== "Done")
      .reduce((sum, task) => {
        const byActual = Math.max(0, task.estimate - task.actual);
        const byProgress = Math.max(0, task.estimate * (1 - task.progress / 100));
        return sum + Math.min(byActual, byProgress);
      }, 0)
      .toFixed(1),
  );

export const scheduledHours = (blocks, rangeStart, rangeEnd) =>
  Number(
    blocks
      .filter((block) => block.type === "task")
      .filter((block) => new Date(block.start) >= rangeStart && new Date(block.start) < rangeEnd)
      .reduce((sum, block) => sum + hoursBetween(block.start, block.end), 0)
      .toFixed(1),
  );

export const getProjectHealth = (project, tasks, blocks, settings) => {
  const projectTasks = tasks.filter((task) => task.projectId === project.id);
  const remaining = remainingHours(projectTasks);
  const daysLeft = Math.max(1, Math.ceil((new Date(project.deadline) - now()) / 864e5));
  const availableHours = Math.max(4, (daysLeft / 7) * settings.weeklyCapacityHours);
  const progress = projectProgress(project, tasks);
  const blocked = projectTasks.filter((task) =>
    task.dependencies.some((dep) => tasks.find((item) => item.id === dep)?.status !== "Done"),
  ).length;
  const missedBlocks = blocks.filter((block) => block.projectId === project.id && new Date(block.end) < now() && !block.outcome).length;
  const capacityScore = Math.max(0, 100 - Math.max(0, remaining - availableHours) * 8);
  const health = Math.max(5, Math.round(progress * 0.35 + capacityScore * 0.45 - blocked * 8 - missedBlocks * 5 + 20));
  const risk = health > 75 ? "On Track" : health > 48 ? "At Risk" : "Unlikely";
  return { health: Math.min(100, health), risk, remaining, daysLeft, progress, blocked };
};

export const completionForecast = (project, tasks, settings) => {
  const projectTasks = tasks.filter((task) => task.projectId === project.id);
  const remaining = remainingHours(projectTasks);
  const weeklyPace = Math.max(4, settings.weeklyCapacityHours / 4);
  const days = Math.ceil((remaining / weeklyPace) * 7);
  return addDays(now(), days);
};

export const unscheduledTasks = (tasks, blocks) => {
  const scheduledIds = new Set(blocks.filter((block) => block.taskId).map((block) => block.taskId));
  return tasks.filter((task) => task.status !== "Done" && !scheduledIds.has(task.id));
};

export const todayBlocks = (blocks) => {
  const start = new Date(now());
  start.setHours(0, 0, 0, 0);
  const end = addDays(start, 1);
  return blocks
    .filter((block) => new Date(block.start) >= start && new Date(block.start) < end)
    .sort((a, b) => new Date(a.start) - new Date(b.start));
};

export const priorityWeight = (priority) => ({ High: 3, Medium: 2, Low: 1 })[priority] || 1;

export const recommendedTask = (tasks, blocks) => {
  const blockedIds = new Set(
    tasks
      .filter((task) => task.dependencies.some((dep) => tasks.find((item) => item.id === dep)?.status !== "Done"))
      .map((task) => task.id),
  );
  const scheduledToday = new Set(todayBlocks(blocks).map((block) => block.taskId));
  return tasks
    .filter((task) => task.status !== "Done" && !blockedIds.has(task.id))
    .sort((a, b) => {
      const aScore = priorityWeight(a.priority) * 10 + (scheduledToday.has(a.id) ? 20 : 0) - Math.ceil((new Date(a.deadline) - now()) / 864e5);
      const bScore = priorityWeight(b.priority) * 10 + (scheduledToday.has(b.id) ? 20 : 0) - Math.ceil((new Date(b.deadline) - now()) / 864e5);
      return bScore - aScore;
    })[0];
};
