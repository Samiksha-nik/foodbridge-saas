# FoodBridge SaaS

FoodBridge is a MERN-based food donation platform that connects **providers**, **NGOs**, and **admins** to reduce food waste and improve redistribution.

The platform supports:
- role-based authentication and onboarding
- donation creation and pickup workflow
- NGO approval and admin moderation
- fraud alerts and notifications
- dashboard and analytics views

## Tech Stack

- **Frontend:** React (Vite), React Router, Recharts, Tailwind
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Auth:** JWT (HTTP-only cookie)
- **Email:** Nodemailer (OTP + password reset)

## Project Structure

```text
foodbridge-saas/
  client/   # React frontend
  server/   # Express API + MongoDB models
```

## Setup Instructions

### 1) Clone and install dependencies

```bash
git clone <your-repo-url>
cd foodbridge-saas
```

Install backend deps:

```bash
cd server
npm install
```

Install frontend deps:

```bash
cd ../client
npm install
```

### 2) Configure environment variables

Create env files:
- `server/.env`
- `client/.env.local`

Use the values shown in the next section.

### 3) Run locally

Start backend (Terminal 1):

```bash
cd server
npm run dev
```

Start frontend (Terminal 2):

```bash
cd client
npm run dev
```

App URLs:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Environment Variables

### Server (`server/.env`)

```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
# MONGO_URI=mongodb+srv://...   # optional backward-compatible key

# Server
PORT=5000

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRY=7d

# Email (optional in dev; required for real OTP/reset emails)
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL for CORS + reset links
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

### Client (`client/.env.local`)

```env
VITE_API_URL=http://localhost:5000
```

## Notes

- Keep `.env` files private. They are ignored by root `.gitignore`.
- If `EMAIL_USER` / `EMAIL_PASS` are missing, OTP and reset links are logged in backend console (dev fallback).
- For production, deploy client and server separately and set `VITE_API_URL`, `CLIENT_URL`, and `FRONTEND_URL` to real domains.
