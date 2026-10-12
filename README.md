# 🏏 Cric Auction – IPL-Style Cricket Auction Platform

**Cric Auction** is a web-based cricket auction platform inspired by IPL player auctions. It lets users experience the excitement of building cricket teams through player bidding and auction management.

🌐 **Live Demo:** https://cric-auction-aoeu.vercel.app

📂 **GitHub Repository:** https://github.com/Nithin18q/CRIC_AUCTION

## ✨ Features

- 🏏 **Cricket Auction Experience** – Participate in an IPL-style player auction.
- 💰 **Team Budget Management** – Track team purses during bidding.
- 👥 **Team Building** – Build a squad by purchasing players.
- 🔐 **Authentication** – Sign-in functionality powered by Firebase Authentication.
- ⚡ **Real-Time Database** – Firebase Realtime Database integration for auction data.
- 🗄️ **Supabase Integration** – Backend database integration.
- 💬 **Chat Feature** – Chat functionality within the application.
- 🛠️ **Admin Panel** – Administrative features for managing the auction.
- 🌐 **Online Deployment** – Hosted on Vercel.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| Vite | Development server and build tool |
| JavaScript | Application logic |
| Firebase Authentication | User authentication |
| Firebase Realtime Database | Real-time auction data |
| Supabase | Database integration |
| Vercel | Deployment and hosting |
| Git & GitHub | Version control |

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Nithin18q/CRIC_AUCTION.git
```

### 2. Navigate to the project folder

```bash
cd CRIC_AUCTION
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env.local` file in the project root and add the environment variables required by the application.

Typical variables include:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_RTDB_FIREBASE_DATABASE_URL=
VITE_FIREBASE_MEASUREMENT_ID=

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

VITE_ADMIN_EMAIL=
VITE_GIPHY_API_KEY=
```

Fill in the values from your own Firebase, Supabase, and other service configurations. Check the source code for any additional environment variables your version requires.

**Security:** Never commit `.env.local`, private service-role keys, service-account credentials, or other secrets to GitHub. Add environment variables separately in Vercel for deployment.

### 5. Start the development server

```bash
npm run dev
```

Open the local URL displayed in your terminal, usually:

```text
http://localhost:5173
```

### 6. Build for production

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## ⚙️ Backend Setup

Before running the application locally:

1. Configure a Firebase project.
2. Enable the authentication providers required by the application.
3. Configure Firebase Realtime Database rules to restrict access appropriately.
4. Set up the required Supabase project and tables.
5. Add the required environment variables to `.env.local`.

Keep database access restricted and validate authorization on the backend before deploying changes.

## 🌍 Deployment

The application is deployed using **Vercel**.

To deploy your own version:

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Add the required environment variables in Vercel project settings.
4. Deploy the application.
5. Configure Firebase Authentication's authorized domains for your deployed domain.


## 🙏 Credits & Acknowledgements

This project is based on the original IPL Auction project by [Shaurya01836](https://github.com/Shaurya01836).

**Original project:** [Shaurya01836/ipl-auction](https://github.com/Shaurya01836/ipl-auction)

The original developer created the foundation of this project. I have extended and customized it with additional features, including:

- **Team Rankings** — ranking teams based on their auction squads.
- **Target Players** — selecting preferred players and setting planned bid limits.
- **Smart Bid Alerts** — alerting users when bids approach or exceed their planned limits.

Thank you to the original developer for the work and inspiration behind this project.

**My modified version:** [Nithin18q/CRIC_AUCTION](https://github.com/Nithin18q/CRIC_AUCTION)

## 📁 Project Structure

```text
CRIC_AUCTION/
├── public/
├── src/
│   ├── components/
│   ├── lib/
│   └── pages/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── eslint.config.js
└── README.md
```

*The exact folders and files may vary depending on the current project version.*

## 🎯 Project Objective

The objective of Cric Auction is to create an interactive cricket auction experience where users can participate in player bidding, manage team budgets, and build squads through a modern web interface.

## 👨‍💻 Author

**Nithin**

- GitHub: https://github.com/Nithin18q
- Project: https://github.com/Nithin18q/CRIC_AUCTION

---

⭐ If you find this project interesting, consider giving the repository a star!

