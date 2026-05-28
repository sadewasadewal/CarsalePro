# 🚗 වාහන පිස්සා.com — Sri Lanka's Premium Car Marketplace

> A full-featured, modern car listing and buying platform built for Sri Lanka — with Firebase Live Mode, Demo Mode, Admin Moderation, and a stunning Glassmorphism UI.

---

## 📸 Preview

| Home Page | Admin Panel | Post Ad |
|-----------|-------------|---------|
| ![Hero Section](assets/images/hero-car.png) | Admin moderation panel | Multi-step ad form |

---

## ✨ Features

### 🏠 Public Marketplace
- **Browse Listings** — Premium car cards with images, year, location, and views counter
- **Advanced Filters** — Airbnb-style filter modal with dual price range slider, histogram, transmission, fuel type, condition, and negotiability selectors
- **Brand Quick-Filters** — Clickable brand logos (Toyota, BMW, Honda, Tesla, Audi, Land Rover) to instantly filter by make
- **Search** — Debounced live search across title, make, model, and description
- **Car Detail Modal** — Full-screen gallery slider, spec table, description, and direct seller contact (Call + WhatsApp)

### 📝 Post Advertisements
- **Secure Ad Submission** — Requires sign-in; seller details auto-populated from account
- **Image Upload & Compression** — Drag-and-drop, up to 5 images, auto-compressed via Canvas API
- **Under Review Flow** — Newly posted ads enter a moderation queue and are hidden from the public until approved by an admin

### 🛡️ Admin Moderation
- **Admin Control Panel** — Dedicated `/admin` tab visible only to admin users
- **Approve / Reject Ads** — One-click moderation actions directly from the admin panel or from inside the ad detail modal
- **Default Admin Account** — `admin@wahanapissa.com` / `adminpassword` (auto-provisioned in both Demo and Firebase modes)

### 👤 User Dashboard
- **My Listings** — View all posted ads with colour-coded status badges:
  - 🟡 **Pending Review** — awaiting admin approval
  - 🟢 **Approved** — visible to the public
  - 🔴 **Rejected** — not published
- **Stats** — Total listings and aggregate view count
- **Delete Listings** — Remove your own ads

### 🔐 Authentication
- **Email / Password** — Sign up and sign in with manual credentials
- **Google Sign-In** — OAuth via Firebase (Live Mode only)
- **Demo Mode** — Pre-seeded mock user profiles for testing without Firebase
- **Password Toggle** — Show/hide password with an animated eye icon button

### 🎨 Design
- **Glassmorphism UI** — Frosted-glass panels, backdrop blur, premium shadows
- **Dark / Light Mode** — Fully themed with smooth transitions
- **Responsive Layout** — Mobile-first, works on all screen sizes
- **Micro-animations** — Pop-in, fade, scale-up entrance animations throughout

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 (Semantic) |
| Styling | Vanilla CSS (Custom Design System) |
| Logic | Vanilla JavaScript (ES Modules) |
| Icons | [Lucide Icons](https://lucide.dev/) |
| Fonts | [Google Fonts — Inter + Noto Sans Sinhala](https://fonts.google.com/) |
| Avatars | [DiceBear Avatars API](https://dicebear.com/) |
| Backend (optional) | [Firebase Firestore + Firebase Auth](https://firebase.google.com/) |
| Images | [Unsplash](https://unsplash.com/) |

> **No build tools required.** Pure HTML/CSS/JS — runs directly in any browser.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/CarsalePro.git
cd CarsalePro
```

### 2. Run Locally

Use any static file server. Python is the quickest:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

> ⚠️ The app **must** be served via HTTP(S) — opening `index.html` directly from the filesystem (`file://`) will block ES Module imports.

---

## 🔥 Firebase Setup (Optional — Live Mode)

Without Firebase, the app runs in **Demo Mode** using `localStorage` — perfect for development and testing.

To enable full Firebase functionality:

### Step 1 — Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Sign-in methods → **Email/Password** and optionally **Google**
4. Enable **Cloud Firestore** → Start in test mode (or production with proper rules)

### Step 2 — Configure `firebase-config.json`

Edit `firebase-config.json` in the project root:

```json
{
  "apiKey": "YOUR_API_KEY",
  "authDomain": "YOUR_PROJECT.firebaseapp.com",
  "projectId": "YOUR_PROJECT_ID",
  "storageBucket": "YOUR_PROJECT.firebasestorage.app",
  "messagingSenderId": "YOUR_SENDER_ID",
  "appId": "YOUR_APP_ID"
}
```

### Step 3 — Set Firestore Rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ads/{adId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 📁 Project Structure

```
CarsalePro/
├── index.html              # Main application (single-page app)
├── firebase-config.json    # Firebase credentials (keep private!)
├── css/
│   └── style.css           # Complete design system & component styles
├── js/
│   ├── app.js              # Main controller — routing, events, UI logic
│   ├── auth.js             # Authentication (Firebase + Demo Mode)
│   ├── db.js               # Database operations (Firestore + localStorage)
│   └── config.js           # Firebase initialization & config loader
└── assets/
    └── images/
        ├── hero-car.png    # Hero section vehicle image
        └── bg.jpg          # Background watermark image
```

---

## 🔑 Default Credentials (Demo Mode)

| Role | Email | Password |
|------|-------|----------|
| Regular User | `kasun.perera@gmail.com` | `password` |
| Regular User | `shashini.silva@gmail.com` | `password` |
| Admin | `admin@wahanapissa.com` | `adminpassword` |

> These credentials are for **Demo Mode only** (local storage). They are automatically available without Firebase. The admin account is also auto-provisioned in Firebase when first used in Live Mode.

---

## 🧩 How the Moderation Flow Works

```
User submits ad
      │
      ▼
Status: "under_review"
(Hidden from homepage, visible in user's Dashboard with 🟡 Pending badge)
      │
      ▼
Admin logs in → Admin Panel shows pending ads
      │
   ┌──┴──┐
Approve   Reject
   │         │
   ▼         ▼
"approved"  "rejected"
Visible on  Marked on
homepage    Dashboard as 🔴
```

---

## 📱 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| `< 768px` | Single column, stacked filter bar |
| `768px – 992px` | 2-column ad grid |
| `> 992px` | 3-column ad grid, horizontal filter capsule bar |

