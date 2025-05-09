# UltraKeeper - Backyard Ultra Lap Tracker

UltraKeeper is a full-stack lap registration system built for backyard ultra events. It uses RFID-based lap scanning, athlete tracking, manual overrides, and a web-based dashboard.

---

## 🧰 Requirements (One-Time Setup)

### Windows & macOS

* **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (Required to run the system)

---

## 🚀 Getting Started

### 1. Clone or unzip the UltraKeeper folder

Place it somewhere on your computer, e.g.:

```
C:\Users\YourName\Documents\ultrakeeper
```

### 2. Open a terminal

#### Windows:

* Press `Win + R`, type `powershell`, hit Enter
* Run:

```powershell
cd "C:\Users\YourName\Documents\ultrakeeper"
docker-compose up --build
```

#### macOS:

* Open **Terminal**
* Run:

```bash
cd ~/Documents/ultrakeeper
docker-compose up --build
```

### 3. Open the app

Go to:

```
http://localhost:4173
```

This is the web interface for:

* ✅ Registering athletes
* 📊 Viewing dashboards
* 🛠 Manually editing lap records

---

## 🔁 Daily Use

Once built, you only need to run:

```bash
docker-compose up
```

To stop the system:

```bash
CTRL+C
```

or in another terminal:

```bash
docker-compose down
```

---

## 💾 Restoring a Backup

Backups are automatically created every 15 minutes and rotated across 5 folders (`slot0` to `slot4`).

### To restore the most recent backup:

#### Windows (PowerShell):

```powershell
.
estore.ps1
```

#### macOS/Linux:

```bash
./restore.sh
```

### To restore a specific slot (e.g. slot2):

```powershell
.
estore.ps1 slot2
```

```bash
./restore.sh slot2
```

---

## 🔒 Notes

* Data is stored in a local Docker volume (`mongo-data`) and survives reboots.
* Backups are kept in `./backups` and auto-rotated.

---

## 📦 Tech Stack

* React + Vite + TypeScript (Frontend)
* Node.js + Express + MongoDB (Backend)
* Docker + Docker Compose (Deployment)

---

## 📞 Support

Need help setting it up? Contact the UltraKeeper admin or refer to this guide.
