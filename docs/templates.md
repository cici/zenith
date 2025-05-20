# Dashboard Template System Documentation

## Overview

The dashboard template system enables rapid creation and management of dashboard layouts and widget configurations, ensuring visual and functional consistency across all dashboard types. Templates are centrally stored in `src/data/dashboard-templates.json` and validated against a JSON schema (`src/types/dashboardTemplate.schema.json`).

Templates are designed to:
- Enforce the Velzon Galaxy dashboard style
- Support responsive layouts and widget configuration
- Allow fine-grained control over user customization
- Enable template inheritance for specialized dashboards

---

## Creating a New Template

Templates are defined as JSON objects in `dashboard-templates.json`. Each template must conform to the schema and include:
- A unique `id`
- A `name` and `dashboardType`
- A `layout` (with breakpoints and items)
- A `widgets` array (with widget ids, types, and config)
- An optional `customization` object

### Example: Productivity Dashboard Template
```json
{
  "id": "productivity-default",
  "name": "Productivity Default",
  "dashboardType": "productivity",
  "description": "To-Do, Pomodoro, and Weather widgets in a classic productivity layout.",
  "layout": {
    "breakpoints": { "lg": 12, "md": 9, "sm": 6, "xs": 4, "xxs": 2 },
    "items": [
      { "i": "todo", "x": 0, "y": 0, "w": 6, "h": 6 },
      { "i": "pomodoro", "x": 6, "y": 0, "w": 6, "h": 3 },
      { "i": "weather", "x": 6, "y": 3, "w": 6, "h": 3 }
    ]
  },
  "widgets": [
    { "id": "todo", "type": "todo", "config": { "defaultView": "all" } },
    { "id": "pomodoro", "type": "pomodoro", "config": { "defaultDuration": 25 } },
    { "id": "weather", "type": "weather", "config": { "location": "auto" } }
  ],
  "customization": {
    "allowWidgetAdd": true,
    "allowWidgetRemove": true,
    "allowWidgetMove": true,
    "allowWidgetResize": true,
    "allowLayoutChange": true,
    "allowedWidgetTypes": ["todo", "pomodoro", "weather"]
  }
}
```

### Example: Analytics Dashboard Template
```json
{
  "id": "analytics-default",
  "name": "Analytics Default",
  "dashboardType": "analytics",
  "description": "Practice Goals, Statistics Dashboard, and To-Do widgets for tracking and analytics.",
  "layout": {
    "breakpoints": { "lg": 12, "md": 9, "sm": 6, "xs": 4, "xxs": 2 },
    "items": [
      { "i": "practiceGoals", "x": 0, "y": 0, "w": 8, "h": 6 },
      { "i": "statisticsDashboard", "x": 8, "y": 0, "w": 4, "h": 3 },
      { "i": "todo", "x": 8, "y": 3, "w": 4, "h": 3 }
    ]
  },
  "widgets": [
    { "id": "practiceGoals", "type": "practiceGoals", "config": { "target": 5 } },
    { "id": "statisticsDashboard", "type": "statisticsDashboard", "config": { "showTrends": true } },
    { "id": "todo", "type": "todo", "config": { "defaultView": "all" } }
  ],
  "customization": {
    "allowWidgetAdd": true,
    "allowWidgetRemove": true,
    "allowWidgetMove": true,
    "allowWidgetResize": true,
    "allowLayoutChange": true,
    "allowedWidgetTypes": ["practiceGoals", "statisticsDashboard", "todo"]
  }
}
```

---

## Template Schema Specification

Templates must conform to the following schema (see `dashboardTemplate.schema.json`):

```json
{
  "id": "string (unique)",
  "name": "string",
  "dashboardType": "string",
  "description": "string (optional)",
  "layout": {
    "breakpoints": { "lg": 12, "md": 9, ... },
    "items": [
      { "i": "string", "x": 0, "y": 0, "w": 6, "h": 6, ... }
    ]
  },
  "widgets": [
    { "id": "string", "type": "string", "config": { ... } }
  ],
  "customization": {
    "allowWidgetAdd": true,
    "allowWidgetRemove": true,
    "allowWidgetMove": true,
    "allowWidgetResize": true,
    "allowLayoutChange": true,
    "allowedWidgetTypes": ["string", ...]
  }
}
```

See the full schema in `src/types/dashboardTemplate.schema.json` for all options and descriptions.

---

## Developer Guidelines

- **Adding a Template:**
  - Add a new object to `dashboard-templates.json` following the schema above.
  - Use unique `id` and `dashboardType` values.
  - Ensure all widgets referenced in `layout.items` and `widgets` exist in the widget registry.
  - Use the Velzon Galaxy style for layout and widget configuration.

- **Validating Templates:**
  - Templates are validated at runtime using AJV and the schema.
  - Invalid templates will throw errors on load.

- **Customizing User Experience:**
  - Use the `customization` object to control which actions users can perform (add, remove, move, resize widgets, etc.).
  - Restrict `allowedWidgetTypes` to limit which widgets can be added.

- **Widget Configuration:**
  - Each widget can have a `config` object for default settings (see widget documentation for options).

---

## Template Inheritance

To create specialized templates based on a base template:
- Add a `baseTemplateId` property (future support) referencing the parent template.
- Override or extend `layout`, `widgets`, or `customization` as needed.
- Inherit all unspecified properties from the base template.

**Example:**
```json
{
  "id": "productivity-advanced",
  "baseTemplateId": "productivity-default",
  "name": "Productivity Advanced",
  "dashboardType": "productivity",
  "widgets": [ ... ],
  "customization": { ... }
}
```

---

## Best Practices

- Use clear, descriptive names and IDs for templates and widgets.
- Keep layouts visually balanced and consistent with Velzon Galaxy design.
- Test templates in the app to ensure correct rendering and customization.
- Document any specialized widget configs in widget documentation.

---

## Velzon Galaxy Style Integration

- All templates should use Velzon Galaxy color schemes, spacing, and typography.
- Widget layouts should align with the Velzon grid and responsive breakpoints.
- Use gradients and soft borders as per the Velzon style guide.
- Reference the UI refactor (Task #12) for design patterns.

---

## Further Reading
- [Widget Registry and Configs](../src/data/widgets.tsx)
- [Dashboard Component](../src/components/Dashboard.tsx)
- [Template Service](../src/services/TemplateService.ts)
- [Schema Definition](../src/types/dashboardTemplate.schema.json) 