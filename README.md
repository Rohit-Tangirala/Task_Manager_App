# Task Manager

> A full-stack task management web application with JWT authentication and CRUD operations, backed by MySQL and deployed on Render.

---

## Tech Stack

**Frontend**
- React (Vite)
- CSS Modules
- React Router v6
- Axios

**Backend**
- Express.js
- jsonwebtoken
- bcryptjs
- mysql2
- cors, dotenv, nodemon

**Database**
- MySQL — Aiven (cloud-hosted)

**Deployment**
- Render


---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/yourusername/task-manager.git
cd task-manager

# Install dependencies
npm install
cd client && npm install && cd ..

# Set up environment variables
cp .env.example .env
# Fill in your Aiven MySQL credentials and JWT secret

# Run in development
npm run dev
```


---

## Deployment

- Frontend builds to `client/dist` via `npm run build`
- Express serves the React build as static files in production
- Hosted on **Render** (single service, one port)
- Database hosted on **Aiven** (MySQL 8.0)

---

## Made by Rohit