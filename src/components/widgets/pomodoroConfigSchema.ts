export const pomodoroWidgetConfigSchema = {
  fields: [
    {
      name: "workDuration",
      type: "number",
      label: "Work Duration (minutes)",
      default: 25,
      min: 5,
      max: 120,
    },
    {
      name: "shortBreakDuration",
      type: "number",
      label: "Short Break (minutes)",
      default: 5,
      min: 1,
      max: 30,
    },
    {
      name: "longBreakDuration",
      type: "number",
      label: "Long Break (minutes)",
      default: 15,
      min: 5,
      max: 60,
    },
    {
      name: "autoStartNext",
      type: "boolean",
      label: "Auto-Start Next Session",
      default: false,
    },
    {
      name: "themeColor",
      type: "color",
      label: "Theme Color",
      default: "#ef4444",
    },
  ],
}; 