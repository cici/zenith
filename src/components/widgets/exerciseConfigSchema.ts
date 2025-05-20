export const exerciseConfigSchema = {
  fields: [
    {
      name: "defaultExerciseDuration",
      type: "number",
      label: "Default Exercise Duration (minutes)",
      default: 30,
      min: 1,
      max: 180,
    },
    {
      name: "enableRestTimer",
      type: "boolean",
      label: "Enable Rest Timer",
      default: true,
    },
    {
      name: "restDuration",
      type: "number",
      label: "Rest Duration (seconds)",
      default: 60,
      min: 10,
      max: 600,
    },
    {
      name: "themeColor",
      type: "color",
      label: "Theme Color",
      default: "#059669",
    },
  ],
}; 