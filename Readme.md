# ⚡ Task Flow (Full Stack)

A modern, highly-polished full-stack task and workspace management application with a premium glassmorphic dark/light UI, designed to organize team projects, assign work, and track real-time progress.

### 🌐 Live Deployment
- **Frontend (Vercel)**: [https://task-flow-iota-seven.vercel.app](https://task-flow-iota-seven.vercel.app)
- **Backend API (Railway)**: [https://task-flow-production-5991.up.railway.app](https://task-flow-production-5991.up.railway.app)

---

## 🎨 Premium Visual Overhaul & Redesign

Task Flow has been completely redesigned with a custom **"Dark Luxe"** design system to stand out as a modern, distinct application:
- **Responsive Layout**: Transitioned from a generic sidebar layout to a sleek top-navbar (desktop) and a compact tab navigation (mobile).
- **Glassmorphism**: Elegant semi-translucent cards, blur backdrops, harmony-tailored colors, and smooth hover micro-animations.
- **Dynamic Theming**: Integrated system preferences and a manual toggle for seamless Light and Dark mode transitions.
- **Simplified Terminology**: Rebranded **Projects** as **Workspaces** and **Tasks** as **Assignments** for a cleaner UX.
- **Status Workflows**: Updated task statuses to modern labels: `Queued`, `Working`, `Review`, and `Finished`.
- **Role Selector**: Integrated a dual-card account type selector during Sign-Up (Admin vs. Member accounts) with customized registration endpoints.

---

## ⚙️ Tech Stack

### Frontend
- **React.js** (Vite)
- **Tailwind CSS** (Custom Extended Utilities)
- **Axios** (API connection client)
- **React Router DOM**
- **React Hook Form + Zod**
- **Lucide React Icons**
- **Recharts** (Custom dashboard data visualization)

### Backend
- **Node.js**
- **Express.js**
- **PostgreSQL** (Production database)
- **Prisma ORM** (Database client)

### Security & Authentication
- **JWT (JSON Web Token)**
- **Google OAuth Integration**
- **bcrypt** (Secure password hashing)

---

## 🔐 Features & Architecture

### 👤 User Registration & Roles
- **Dual-Card Signup**: Choose to join as a **Member** (view & update tasks) or an **Admin** (full workspace and team control).
- **Secure Sessions**: Single-card minimal login layout with password verification and Google login prioritization.

### 📁 Workspace Management
- Create workspaces with:
  - Custom names and details
  - Start & Deadline dates
  - Interactive member invite/team association modal

### ✅ Assignment Tracking
- Group assignments by workspace
- Assign tasks to team members with customizable Urgency (`Low`, `Medium`, `High`) and Status.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### 1. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   PORT=5000
   DATABASE_URL="YOUR_POSTGRESQL_CONNECTION_STRING"
   JWT_SECRET="YOUR_JWT_SECRET"
   FRONTEND_URL="http://localhost:5173"
   GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
   ```
4. Push database schema and run seed:
   ```bash
   npx prisma db push
   npm run seed
   ```
5. Start the server:
   ```bash
   npm start
   ```

### 2. Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   VITE_API_URL="http://localhost:5000/api"
   VITE_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
