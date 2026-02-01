# Smart Logistics 🚚📦

A modern full-stack shipment tracking dashboard built with **React (Vite + TypeScript)**, **Express (TypeScript)**, and **MongoDB Atlas**, featuring **JWT authentication**, shipment CRUD, analytics, and an elegant UI.

> Built to demonstrate a real-world logistics workflow: create shipments, track status changes, view details, and analyze shipment performance.

---

## ✨ Features

### ✅ Authentication (JWT)
- Register & login with email/password
- JWT stored in the client (`localStorage`)
- Protected API routes using middleware (`requireAuth`)
- User data isolated (each user only sees their own shipments)

### ✅ Shipments
- Create shipment (with `datetime-local` ETA input)
- Update shipment status: **Pending / In Transit / Delivered**
- Delete shipment
- Shipment details page: clean, modern UI and actions
- Search and filter shipments by status + query

### ✅ Analytics
- Backend-driven stats endpoint
- Shows totals and status distribution
- “Key insights” area (delivery rate, max bar, etc.)

### ✅ UI / UX
- Clean layout with `AppShell`
- Responsive design
- Status badges with consistent color system
- Friendly feedback messages (success/errors)

---

## 🧰 Tech Stack

**Frontend**
- React + TypeScript (Vite)
- TailwindCSS
- Axios (via custom `http` client)
- React Router

**Backend**
- Node.js + Express (TypeScript)
- MongoDB + Mongoose
- Zod validation
- JWT (jsonwebtoken)
- Password hashing (bcryptjs)

---



