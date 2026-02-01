# Smart Logistics 🚚📦
A full-stack shipment tracking app built with **Express + MongoDB + JWT** (backend) and **React + Vite + Tailwind** (frontend).  
Create shipments, track statuses, view shipment details, and explore basic analytics.

---

## ✨ Features

### ✅ Authentication
- Register & login with email/password
- JWT-based auth (protected API routes)
- Token stored client-side (LocalStorage)

### ✅ Shipments
- Create shipments (ETA supports `datetime-local`)
- List shipments with filtering & search
- Update shipment status (Pending / In Transit / Delivered)
- Delete shipments
- Shipment details page (`/shipments/:id`)

### ✅ Analytics
- Stats endpoint (`/api/shipments/stats`)
- Frontend analytics page with:
  - Total shipments
  - Status distribution
  - Simple bar visualization

---

## 🧱 Tech Stack

### Backend
- Node.js + TypeScript
- Express
- MongoDB Atlas + Mongoose
- Zod validation
- JWT (jsonwebtoken)
- bcryptjs password hashing

### Frontend
- React + TypeScript
- Vite
- React Router
- Tailwind CSS
- Axios (via a small `http` wrapper)

---

## 📂 Project Structure

