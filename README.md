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

### 1. Install Docker Desktop and Git

* Download: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
* During installation, check the option to **"Use Windows containers"** if asked (not required on macOS).
* Download: https://git-scm.com/downloads/win
*Select "Git from the command line and also from 3rd-party software" when prompted.
---

### 2. Download UltraKeeper

Open "Docker desktop"


Open Poweshell by pressing Win+R (🪟+R) and search powershell

Then copy and paste one line below at a time, press enter between.


```bash
git --version
```
Check that it shows some version number, if not, try to uninstall git and reinstall.

then:

```bash
cd "$env:USERPROFILE\Documents"
git clone https://github.com/MikaelStoen/ultrakeeper.git
cd ultrakeeper
docker compose up
```

if you run into errors with the docker compose up command do: 

```bash
docker compose down
docker compose build
docker compose up
```

### 3. Open the Web App

Once running, visit:

```
http://localhost:3000
```

---

## 🔄 Daily Use

To start the system after first setup:

```bash

cd "$env:USERPROFILE\Documents"
cd ultrakeeper
docker compose up
```

To stop it:

* Press `CTRL+C`, or in a new terminal run:

```bash
docker compose down
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
