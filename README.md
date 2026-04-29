# Team Task Manager

A full-stack web app to manage projects, assign tasks, and track progress with role-based access control.

## Tech Stack
- **Frontend** — Next.js, Tailwind CSS
- **Backend** — Express.js, Node.js
- **Database** — PostgreSQL
- **Auth** — JWT + bcrypt
- **Deployment** — Railway

## Features
- Signup / Login with JWT authentication
- Create projects and manage team members
- Role-based access — Admin and Member
- Create, assign, and track tasks (todo / in progress / done)
- Dashboard with task stats and overdue tasks

## Database Schema
- `users` — stores user accounts
- `projects` — stores project details
- `project_members` — stores who is in which project and their role
- `tasks` — stores tasks with status, priority and due date

