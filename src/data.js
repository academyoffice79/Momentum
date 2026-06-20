const today = new Date();

const isoAt = (dayOffset, hour, minute = 0) => {
  const value = new Date(today);
  value.setDate(value.getDate() + dayOffset);
  value.setHours(hour, minute, 0, 0);
  return value.toISOString();
};

export const seedData = {
  settings: {
    workdayStart: 7,
    workdayEnd: 21,
    weeklyCapacityHours: 32,
    focusWindowStart: 16,
  },
  projects: [
    {
      id: "proj-aerospace",
      name: "Aerospace Simulation Platform",
      color: "#5b6ee1",
      deadline: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 41);
        return d.toISOString().split('T')[0];
      })(),
      goal: "Build a validated orbital propagation and visualization toolkit.",
      area: "Research",
    },
    {
      id: "proj-physics",
      name: "AP Physics 2 Final Review",
      color: "#0ea5a4",
      deadline: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 17);
        return d.toISOString().split('T')[0];
      })(),
      goal: "Master the highest-yield units and complete two full practice exams.",
      area: "School",
    },
    {
      id: "proj-college",
      name: "College Applications",
      color: "#c2410c",
      deadline: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 65);
        return d.toISOString().split('T')[0];
      })(),
      goal: "Prepare essays, recommendation packet, and application timeline.",
      area: "Applications",
    },
    {
      id: "proj-taekwondo",
      name: "Taekwondo App Development",
      color: "#8b5cf6",
      deadline: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 29);
        return d.toISOString().split('T')[0];
      })(),
      goal: "Ship the first usable practice tracker for students.",
      area: "Software",
    },
  ],
  milestones: [
    { id: "mile-aero-1", projectId: "proj-aerospace", name: "Numerics foundation", due: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 13);
      return d.toISOString().split('T')[0];
    })() },
    { id: "mile-aero-2", projectId: "proj-aerospace", name: "Orbital propagator", due: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 27);
      return d.toISOString().split('T')[0];
    })() },
    { id: "mile-aero-3", projectId: "proj-aerospace", name: "Validation and docs", due: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 41);
      return d.toISOString().split('T')[0];
    })() },
    { id: "mile-physics-1", projectId: "proj-physics", name: "Electricity and circuits", due: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 5);
      return d.toISOString().split('T')[0];
    })() },
    { id: "mile-physics-2", projectId: "proj-physics", name: "Practice exam sprint", due: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 16);
      return d.toISOString().split('T')[0];
    })() },
    { id: "mile-college-1", projectId: "proj-college", name: "Essay system", due: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 20);
      return d.toISOString().split('T')[0];
    })() },
    { id: "mile-tae-1", projectId: "proj-taekwondo", name: "Training log MVP", due: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 19);
      return d.toISOString().split('T')[0];
    })() },
  ],
  tasks: [
    {
      id: "task-rk4",
      projectId: "proj-aerospace",
      milestoneId: "mile-aero-1",
      title: "Implement RK4 solver",
      priority: "High",
      estimate: 5,
      actual: 2.5,
      deadline: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 9);
        return d.toISOString().split('T')[0];
      })(),
      status: "In Progress",
      progress: 45,
      tags: ["coding", "math"],
      dependencies: ["task-integration-research"],
    },
    {
      id: "task-integration-research",
      projectId: "proj-aerospace",
      milestoneId: "mile-aero-1",
      title: "Research numerical integration methods",
      priority: "High",
      estimate: 3,
      actual: 3.25,
      deadline: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        return d.toISOString().split('T')[0];
      })(),
      status: "Done",
      progress: 100,
      tags: ["research"],
      dependencies: [],
    },
    {
      id: "task-validate-orbits",
      projectId: "proj-aerospace",
      milestoneId: "mile-aero-2",
      title: "Validate orbital propagator",
      priority: "High",
      estimate: 6,
      actual: 0,
      deadline: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 24);
        return d.toISOString().split('T')[0];
      })(),
      status: "Todo",
      progress: 0,
      tags: ["testing", "analysis"],
      dependencies: ["task-rk4"],
    },
    {
      id: "task-physics-review",
      projectId: "proj-physics",
      milestoneId: "mile-physics-1",
      title: "Physics circuits review set",
      priority: "High",
      estimate: 4,
      actual: 1.5,
      deadline: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 5);
        return d.toISOString().split('T')[0];
      })(),
      status: "In Progress",
      progress: 35,
      tags: ["school", "practice"],
      dependencies: [],
    },
    {
      id: "task-practice-exam",
      projectId: "proj-physics",
      milestoneId: "mile-physics-2",
      title: "Take timed practice exam",
      priority: "Medium",
      estimate: 3,
      actual: 0,
      deadline: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 11);
        return d.toISOString().split('T')[0];
      })(),
      status: "Todo",
      progress: 0,
      tags: ["exam"],
      dependencies: ["task-physics-review"],
    },
    {
      id: "task-essay-outline",
      projectId: "proj-college",
      milestoneId: "mile-college-1",
      title: "Draft common app essay outline",
      priority: "High",
      estimate: 2,
      actual: 0.5,
      deadline: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().split('T')[0];
      })(),
      status: "In Progress",
      progress: 20,
      tags: ["writing"],
      dependencies: [],
    },
    {
      id: "task-rec-packet",
      projectId: "proj-college",
      milestoneId: "mile-college-1",
      title: "Prepare recommendation packet",
      priority: "Medium",
      estimate: 2.5,
      actual: 0,
      deadline: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 15);
        return d.toISOString().split('T')[0];
      })(),
      status: "Todo",
      progress: 0,
      tags: ["admin"],
      dependencies: [],
    },
    {
      id: "task-training-log",
      projectId: "proj-taekwondo",
      milestoneId: "mile-tae-1",
      title: "Build student training log",
      priority: "Medium",
      estimate: 7,
      actual: 2,
      deadline: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 19);
        return d.toISOString().split('T')[0];
      })(),
      status: "In Progress",
      progress: 30,
      tags: ["coding", "ux"],
      dependencies: [],
    },
    {
      id: "task-design-streaks",
      projectId: "proj-taekwondo",
      milestoneId: "mile-tae-1",
      title: "Design practice streak model",
      priority: "Low",
      estimate: 2,
      actual: 0,
      deadline: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 21);
        return d.toISOString().split('T')[0];
      })(),
      status: "Todo",
      progress: 0,
      tags: ["product"],
      dependencies: ["task-training-log"],
    },
  ],
  blocks: [
    { id: "block-1", taskId: "task-rk4", projectId: "proj-aerospace", type: "task", title: "Implement RK4 solver", start: isoAt(0, 16), end: isoAt(0, 17, 30), actual: 0 },
    { id: "block-2", taskId: "task-physics-review", projectId: "proj-physics", type: "task", title: "Physics review", start: isoAt(0, 18), end: isoAt(0, 19), actual: 0 },
    { id: "block-3", taskId: "task-essay-outline", projectId: "proj-college", type: "task", title: "Essay outline", start: isoAt(1, 17), end: isoAt(1, 18), actual: 0 },
    { id: "event-school", type: "event", title: "School", start: isoAt(0, 8), end: isoAt(0, 15), color: "#2563eb" },
    { id: "event-training", type: "event", title: "Taekwondo class", start: isoAt(2, 18), end: isoAt(2, 19, 30), color: "#7c3aed" },
  ],
};
