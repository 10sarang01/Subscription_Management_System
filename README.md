# Brightloop Systems — User Authentication & Database (Step 1)

Step 1 of the Brightloop Software Subscription Management platform: A local SQLite database for user details with an Admin role and a React.js login page styled with Neumorphism (Soft UI) — built entirely in **JavaScript / Node.js (No Python)**.

---

## 🚀 Features Implemented

1. **Local SQLite Database (`users.db`)**:
   - Stores user details exclusively.
   - Pre-seeded with a default **Admin** account (`admin@brightloop.com`), plus sample Staff and Customer accounts.
   - Schema enforces unique emails (case-insensitive), password hashing (`bcrypt`), and roles (`admin`, `staff`, `customer`).

2. **React.js Authentication Frontend**:
   - **Sign In Tab**: Email and password authentication with Remember Me option.
   - **Quick-Fill Demo Persona Buttons**: One-click autofill for testing **Admin**, **Staff**, and **Customer**.
   - **Customer Registration Tab**: Interactive form with real-time password requirements verification based on Brightloop specification:
     - More than 8 characters (`> 8`)
     - At least 1 uppercase letter (`[A-Z]`)
     - At least 1 lowercase letter (`[a-z]`)
     - At least 1 special character (`[!@#$%^&*...]`)
   - **Forgot Password Modal**: Simulates password reset links dispatched to registered emails.
   - **Live Dashboard**:
     - Displays authenticated profile information and role badge.
     - **Admin Control**: Live view of the SQLite `users.db` directory and restricted ability to onboard internal staff members ("Only the admin can add a new member of staff").
     - **Customer Portal**: Self-service portal view.

3. **Neumorphism (Soft UI) CSS**:
   - Soft embossed convex card shadows (`box-shadow: 10px 10px 20px #b8c2cc, -10px -10px 20px #ffffff`).
   - Tactile debossed/inset shadows for input fields and active pressed buttons.
   - Modern typography using *Plus Jakarta Sans*.

4. **100% No Python**:
   - Backend powered by **Node.js + Express** and **better-sqlite3** with JSON Web Tokens (JWT) and Bcrypt encryption.

---

## 🔑 Default Credentials

| Role | Name | Email | Password |
|---|---|---|---|
| **Admin** | Elena Vance | `admin@brightloop.com` | `Admin@BrightLoop2026!` |
| **Staff** | Sarah Jenkins | `sarah.ops@brightloop.com` | `Staff@BrightLoop2026!` |
| **Customer** | Alice Smith | `alice@cornerbakery.com` | `Customer@BrightLoop2026!` |

*(You can also use the one-click demo buttons directly inside the login UI).*

---

## 🛠️ How to Run

### Option 1: Run Server (Serves Backend & Built React UI)
```bash
npm start
```
Open **[http://localhost:5001](http://localhost:5001)** in your browser.

### Option 2: Run in Vite Development Mode
```bash
# In terminal 1: Start backend
npm run server

# In terminal 2: Start Vite React dev server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📁 Project Structure

```
├── users.db               # SQLite local database (Users details only)
├── server/
│   ├── db.js              # SQLite database schema, seeding & query methods
│   └── index.js           # Express REST API (Auth, JWT, Register, Staff Creation)
├── src/
│   ├── components/
│   │   ├── LoginForm.jsx           # Neumorphic login with quick demo personas
│   │   ├── RegisterForm.jsx        # Customer sign up with password criteria checks
│   │   ├── ResetPasswordModal.jsx  # Reset link modal
│   │   └── Dashboard.jsx           # Role-based dashboard & SQLite users table
│   ├── App.jsx            # Main app shell & state management
│   ├── index.css          # Neumorphic CSS styling system
│   └── main.jsx           # React DOM root entry
├── package.json
└── vite.config.mjs
```
