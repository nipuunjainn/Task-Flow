# 🚀 Team Task Manager (Full Stack)

A production-ready full-stack web application to manage team projects, assign tasks, and track progress with role-based access control.

---

## 🌐 Live Demo
https://team-task-manager-beta-opal.vercel.app/

---

## 🧠 Problem Statement

Managing team tasks across multiple projects can become chaotic without proper structure, access control, and tracking.  
This application solves that by providing a centralized system with **Admin and Member roles**, ensuring secure and efficient collaboration.

---

## ⚙️ Tech Stack

### Frontend
- React.js (Vite)
- Tailwind CSS
- Axios
- React Router DOM
- React Hook Form + Zod
- Recharts (for analytics)

### Backend
- Node.js
- Express.js
- PostgreSQL
- Prisma ORM

### Authentication
- JWT (JSON Web Token)
- Google OAuth
- bcrypt (password hashing)

### Deployment
- Backend: Railway
- Frontend: Vercel

---

## 🔐 Features

### 👤 Authentication
- User registration & login
- Google OAuth login
- Secure password hashing
- JWT-based authentication

---

### 🛠️ Role-Based Access Control (RBAC)

#### 🔹 Admin
- Create, update, delete projects
- Add/remove project members
- Assign tasks
- View all project tasks and analytics

#### 🔹 Member
- View assigned tasks
- Update task status
- Track deadlines

---

### 📁 Project Management
- Create projects with:
  - Name
  - Description
  - Start & Due dates
- Add multiple members to projects

---

### ✅ Task Management
- Create tasks under projects
- Assign tasks to members
- Task fields:
  - Title
  - Description
  - Priority (Low, Medium, High)
  - Status (To Do, In Progress, Review, Completed)
  - Due date

---

### 📊 Dashboard Analytics
- Total projects
- Completed tasks
- Pending tasks
- Overdue tasks

---
