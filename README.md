<div align="center">
  <img width="1200" height="475" alt="Stockism Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

<h1 align="center">📈 STOCKISM — Elite Lookism Trading Terminal</h1>

<p align="center">
  <strong>A real-time character stock market simulation based on the Lookism universe.</strong><br />
  Trade shares of your favourite fighters, track market fluctuations, build your portfolio,<br />
  and climb the leaderboard to establish dominance.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=white&style=flat-square" alt="React" />
  <img src="https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white&style=flat-square" alt="Vite" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white&style=flat-square" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black&style=flat-square" alt="Firebase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square" alt="Tailwind CSS" />
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Main Exchange** | Real-time character stock trading with live price updates |
| **Waifu Index** | Dedicated market segment for female character shares |
| **Portfolio Dashboard** | View your holdings, net worth, and trade history |
| **Leaderboard** | Competitive ranking of all agents by net worth |
| **Daily Voting** | Vote for your favourite characters (popularity & strength) |
| **Admin Panel** | Manage characters, users, news, and market events |
| **Firebase Auth** | Email/password authentication with secure session handling |
| **Dark & Neon Themes** | Immersive cyberpunk UI with theme persistence |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (with npm)
- A **Firebase project** (Firestore + Authentication)

### Installation

```bash
# Clone the repository
git clone https://github.com/Xollonox/Stockism.git
cd Stockism

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your Firebase config

# Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite 6 |
| **Styling** | Tailwind CSS 4 (via CDN), CSS custom properties |
| **Backend** | Firebase Firestore (real-time database) |
| **Auth** | Firebase Authentication (email/password) |
| **Hosting** | Netlify-ready (`netlify.toml` included) |

---

## 📁 Project Structure

```
Stockism/
├── components/
│   ├── features/          # Feature components (Market, Trade, Admin, etc.)
│   └── ui/                # Reusable UI primitives (Button, Input, Select)
├── core/
│   ├── App.tsx            # Main application logic & routing
│   ├── index.tsx          # Entry point
│   └── types.ts           # TypeScript type definitions
├── services/
│   └── firebase.ts        # Firebase client configuration & utilities
├── constants.ts           # Game constants (crews, rarities, admin email)
├── index.html             # Vite entry HTML
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable **Authentication** (Email/Password sign-in method)
3. Create a **Firestore Database** (start in test mode, then secure with rules)
4. Copy your Firebase config into `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 🌐 Deployment

The project is configured for **Netlify** deployment via `netlify.toml`. To deploy:

1. Push to GitHub
2. Connect your repo to Netlify
3. Set the build command to `npm run build`
4. Set the publish directory to `dist`
5. Add your Firebase env vars in Netlify's dashboard

---

## 📜 License

This project is built and maintained by **Xollonox**. All rights reserved. Lookism is a trademark of PTJ Studio.

---

<p align="center">
  <sub>Built with ❤️ by <strong>Xollonox</strong></sub>
</p>
