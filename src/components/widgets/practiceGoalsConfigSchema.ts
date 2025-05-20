export const practiceGoalsConfigSchema = {
  fields: [
    {
      name: "defaultGoalType",
      type: "dropdown",
      label: "Default Goal Type",
      options: [
        { value: "daily", label: "Daily" },
        { value: "weekly", label: "Weekly" },
      ],
      default: "daily",
    },
    {
      name: "defaultMinutes",
      type: "number",
      label: "Default Minutes per Goal",
      default: 30,
      min: 1,
      max: 300,
    },
    {
      name: "enableReminders",
      type: "boolean",
      label: "Enable Reminders",
      default: true,
    },
    {
      name: "reminderTime",
      type: "string",
      label: "Reminder Time (HH:MM)",
      default: "18:00",
    },
    {
      name: "themeColor",
      type: "color",
      label: "Theme Color",
      default: "#4F46E5",
    },
  ],
}; 