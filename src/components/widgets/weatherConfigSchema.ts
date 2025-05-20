export const weatherConfigSchema = {
  fields: [
    {
      name: "defaultCity",
      type: "string",
      label: "Default City",
      default: "Reston, VA",
    },
    {
      name: "units",
      type: "dropdown",
      label: "Units",
      options: [
        { value: "metric", label: "Metric (°C, m/s)" },
        { value: "imperial", label: "Imperial (°F, mph)" },
      ],
      default: "metric",
    },
    {
      name: "themeColor",
      type: "color",
      label: "Theme Color",
      default: "#0EA5E9",
    },
  ],
}; 