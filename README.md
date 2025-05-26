# UltraKeeper - Backyard Ultra Lap Tracker

UltraKeeper is a complete lap registration system for backyard ultra races. It lets you scan laps using RFID, register athletes, monitor progress on a live dashboard, and recover from failures using automatic backups.

---

## ✨ Features

* RFID-based lap scanning
* Manual lap and checkpoint entry
* Live admin dashboard
* Auto-forfeit detection
* Hourly backups and simple restore
* Fully containerized with Docker

---

## 🚀 Setup Instructions (Windows/macOS)

### 1. Install Docker Desktop

* Download: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
* During installation, check the option to **"Use Windows containers"** if asked (not required on macOS).

---

### 2. Download UltraKeeper

Option A: **Download ZIP**

* Go to: [https://github.com/MikaelStoen/ultrakeeper](https://github.com/MikaelStoen/ultrakeeper)
* Click **"Code" > "Download ZIP"**, then unzip it somewhere (e.g. `Documents/ultrakeeper`)

Option B: **Use Git (for developers)**

```bash
git clone https://github.com/MikaelStoen/ultrakeeper.git
cd ultrakeeper
```

---

### 3. Start the App

#### Windows

1. Press `Win + R`, type `powershell`, hit Enter
2. Run:

```powershell
cd "C:\Users\YourName\Documents\ultrakeeper"
docker compose up --build
```

#### macOS

1. Open Terminal
2. Run:

```bash
cd ~/Documents/ultrakeeper
docker compose up --build
```

---

### 4. Open the Web App

Once running, visit:

```
http://localhost:3000
```

---

## 🔄 Daily Use

To start the system after first setup:

```bash
docker compose up
```

To stop it:

* Press `CTRL+C`, or in a new terminal run:

```bash
docker compose down
```

---

## 📂 Restore from Backup

Backups are created every 15 minutes and stored in rotating folders (`slot0` to `slot4`).

### Windows

```powershell
./restore.ps1           # restore latest
./restore.ps1 slot2     # restore specific slot
```

### macOS/Linux

```bash
./restore.sh            # restore latest
./restore.sh slot2      # restore specific slot
```

---

## 🔐 Notes

* Admin functions (e.g. delete lap) require a password prompt.
* Password is set in `.env` as `ADMIN_TOKEN`
* Data is stored persistently in a Docker volume.
* All containers can be rebuilt using `docker compose up --build`

---

## 📦 Tech Stack

* Frontend: React + Vite + Tailwind (served with NGINX)
* Backend: Node.js + Express
* Database: MongoDB
* Deployment: Docker + Docker Compose

---

## 🚑 Support

For any help, reach out via the GitHub repo:
[https://github.com/MikaelStoen/ultrakeeper](https://github.com/MikaelStoen/ultrakeeper)
