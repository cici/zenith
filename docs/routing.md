# Dashboard Routing & Query Parameter Documentation

## Available Dashboard Routes

| Route                                 | Description                | Access Control      |
|----------------------------------------|----------------------------|--------------------|
| `/dashboard/productivity`              | Productivity Dashboard     | Authenticated      |
| `/dashboard/wellness`                  | Wellness Dashboard         | Authenticated      |
| `/dashboard/analytics`                 | Analytics Dashboard        | Authenticated, Pro |

---

## Query Parameters

Each dashboard route supports query parameters for filters and views. These parameters update the dashboard state without a full page reload.

### Productivity Dashboard
- **Route:** `/dashboard/productivity`
- **Query Parameters:**
  - `filter` (string): Filter tasks/widgets (e.g., `overdue`, `completed`)
  - `view` (string): View mode (e.g., `summary`, `detailed`)
- **Example:**  
  `/dashboard/productivity?filter=overdue&view=summary`

### Wellness Dashboard
- **Route:** `/dashboard/wellness`
- **Query Parameters:**
  - `filter` (string): Filter widgets (e.g., `active`, `all`)
  - `view` (string): View mode (e.g., `summary`, `detailed`)
- **Example:**  
  `/dashboard/wellness?filter=active&view=summary`

### Analytics Dashboard
- **Route:** `/dashboard/analytics`
- **Query Parameters:**
  - `period` (string): Time period (e.g., `week`, `month`)
  - `view` (string): View mode (e.g., `summary`, `detailed`)
- **Example:**  
  `/dashboard/analytics?period=month&view=detailed`

---

## How to Link to a Specific Dashboard State

To link to a dashboard with specific filters or views, simply append the desired query parameters:

```tsx
import { Link } from 'react-router-dom';

<Link to="/dashboard/analytics?period=month&view=detailed">
  Analytics (Monthly, Detailed)
</Link>
```

---

## How to Update Query Parameters from UI Controls

Use the `useSearchParams` hook from `react-router-dom`:

```tsx
import { useSearchParams } from 'react-router-dom';

const [searchParams, setSearchParams] = useSearchParams();

const handlePeriodChange = (newPeriod: string) => {
  searchParams.set('period', newPeriod);
  setSearchParams(searchParams);
};
```

---

## Access Control Rules

- All dashboards require authentication.
- The Analytics dashboard requires a `"pro"` subscription tier (see `ProtectedRoute` usage).

---

## Summary

- Dashboard routes are fully dynamic and support query parameters for filters and views.
- Query parameters can be set via links or UI controls, and changes are reflected without a full reload.
- Access control is enforced at the route level. 