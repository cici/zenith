export const todoWidgetConfigSchema = {
  fields: [
    {
      name: "showCompleted",
      type: "boolean",
      label: "Show Completed Tasks",
      default: true,
    },
    {
      name: "maxTasks",
      type: "number",
      label: "Max Tasks",
      default: 10,
      min: 1,
      max: 100,
    },
    {
      name: "themeColor",
      type: "color",
      label: "Theme Color",
      default: "#32224A",
    },
  ],
}; 