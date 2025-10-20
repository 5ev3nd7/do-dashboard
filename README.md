# 🧭 DigitalOcean Dashboard

A custom-built internal tool for monitoring deployment activity, health status, and performance across DigitalOcean applications — all from a single unified interface.

Built with **Next.js**, **Tailwind CSS**, and integrated with both the **DigitalOcean REST API** and **GitHub API** for live build tracking, commit visibility, and operational insight.

---

## 🚀 Features

- Real-time status of all DigitalOcean projects and deployments  
- Application health and uptime monitoring  
- Build logs, resource utilization, and rollback visibility  
- GitHub integration for repository info and commit details  
- Clean, responsive interface built with Tailwind CSS  
- Secure API routing via Next.js  

---

## 🧰 Tech Stack

- **Framework:** Next.js 15  
- **Language:** TypeScript  
- **Styling:** Tailwind CSS  
- **APIs:** DigitalOcean REST API v2, GitHub API  
- **Package Manager:** pnpm (preferred)  
- **Hosting:** DigitalOcean App Platform  
- **DNS/SSL:** Cloudflare  

---

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/<your-org-or-username>/do-dashboard.git
cd do-dashboard
```

### 2. Install Dependencies
Use pnpm (preferred):

```bash
pnpm install
```

If you don't have pnpm installed:

```bash
npm install -g pnpm
```

### 3. Set Up Environment Variables
Create a .env.local file in the project root and add your DigitalOcean API Key:

```bash
DIGITALOCEAN_API_KEY=your_digitalocean_api_key_here
```

# Note:
You'll need to create a new DigitalOcean Personal Access Token from the account you want to monitor.

- Go to: DigitalOcean Control Panel → API → Tokens/Keys
- Generate a new token with Read permissions
- Copy the token and paste it into the .env.local file

### 4. Run the Development Server

```bash
pnpm dev
```

Visit the app at http://localhost:3000.

### 5. Build for Production

```bash
pnpm build
pnpm start
```
