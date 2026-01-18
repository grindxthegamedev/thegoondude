# Admin Panel

Protected admin pages for managing LustList 411.

## Routes

| Route | Description |
|-------|-------------|
| `/admin` | Main dashboard with stats, pending reviews |
| `/admin/sites` | Manage all sites, trigger AI reviews |
| `/admin/users` | User management |

## Features

- **Dashboard**: Overview stats, pending queue
- **Site Management**: Approve/reject, trigger crawl, edit reviews
- **User Management**: View submissions, manage roles

## Protection

Admin routes are protected via Firebase Auth custom claims:
- Requires `role: 'admin'` in user claims
- Uses `useAdmin` hook for data fetching
- Redirects non-admin users

## Key Components

- `page.tsx` - Dashboard with stats cards
- `sites/page.tsx` - Site list with action buttons
- `users/page.tsx` - User list
