# Dashboard & Widget Data Schema Documentation

## Entity-Relationship Diagram (ASCII)

```
+---------+        +-------------+        +---------+
|  users  |<------>| dashboards  |<------>| widgets |
+---------+        +-------------+        +---------+
    | user_id         | id (PK)             | id (PK)
    |                 | user_id (FK)        | dashboard_id (FK)
    |                 | name                | type
    |                 | created_at          | config
    |                 | updated_at          | position
    |                 | layout_configuration| created_at
    |                 | ...                 | updated_at
```

## Field Descriptions

### dashboards
- `id`: Unique identifier (PK)
- `user_id`: Foreign key to users
- `name`: Dashboard name
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update
- `layout_configuration`: JSON for layout/grid

### widgets
- `id`: Unique identifier (PK)
- `dashboard_id`: Foreign key to dashboards
- `type`: Widget type (e.g., todo, weather)
- `config`: Widget-specific settings (JSON)
- `position`: Position/order in dashboard
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

## Example JSON Objects

### Dashboard
```json
{
  "id": "dashboard-123",
  "user_id": "user-456",
  "name": "Productivity Dashboard",
  "created_at": "2024-06-01T12:00:00Z",
  "updated_at": "2024-06-02T09:30:00Z",
  "layout_configuration": {
    "lg": [
      { "i": "todo", "x": 0, "y": 0, "w": 6, "h": 6 },
      { "i": "pomodoro", "x": 6, "y": 0, "w": 6, "h": 3 }
    ]
  }
}
```

### Widget
```json
{
  "id": "widget-789",
  "dashboard_id": "dashboard-123",
  "type": "todo",
  "config": { "defaultView": "all" },
  "position": 1,
  "created_at": "2024-06-01T12:01:00Z",
  "updated_at": "2024-06-01T12:01:00Z"
}
```

## Notes
- All widgets are associated with a dashboard via `dashboard_id`.
- The schema supports multiple dashboards per user and multiple widgets per dashboard.
- Extend as needed for additional fields or widget types. 