export const guitarPracticeConfigSchema = {
  fields: [
    {
      name: "defaultSessionDuration",
      type: "number",
      label: "Default Session Duration (minutes)",
      default: 30,
      min: 1,
      max: 300,
    },
    {
      name: "defaultBpm",
      type: "number",
      label: "Default BPM",
      default: 120,
      min: 40,
      max: 300,
    },
    {
      name: "themeColor",
      type: "color",
      label: "Theme Color",
      default: "#2563EB",
    },
  ],
}; 