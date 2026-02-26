# Past Question Manager (PQM)

**Past Question Manager** is a self-hosted, local web application designed to help students organize, manage, and study past exam questions effectively. Unlike simple image galleries, PQM focuses on active recall and structured study.

![PQM Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Screenshot)

## 🚀 Features

*   **Smart Dashboard:** Overview of stats, recent activity, and unsolved questions.
*   **Customizable Sidebar:** Edit course details and **drag & drop** to reorder your sidebar.
*   **Continuous Question Flow:** Grouped image/text parts for a single-document feel.
*   **Alternative Solutions:** Support for multiple solutions per question with **Tabbed Navigation**.
*   **Gallery Uploader:** Drag & drop or paste multiple images at once for both questions and solutions.
*   **Active Recall:** Solutions hidden by default.
*   **Rich Content:** Markdown support for notes and references.
*   **Organization:** Course-based structure with robust Tagging and Search.

## 🛠️ Tech Stack

*   **Frontend:** React (Vite), Tailwind CSS.
*   **Backend:** Node.js, Express, SQLite (better-sqlite3).
*   **Logging:** Morgan & custom JSON logger.
*   **Testing:** Vitest (Frontend), Jest & Supertest (Backend).
*   **Storage:** Local file system.

## ⚡ Quick Start

### 1. Installation
Run the installer for your operating system:
*   **Linux**: `./install-linux.sh`
*   **macOS**: `./install-mac.sh`
*   **Windows**: Double-click `install.bat`

### 2. Running the App
*   **Linux/macOS**: `./start.sh`
*   **Windows**: Double-click `start-windows.bat`

**Open Browser**: `http://localhost:5173`

## 🌐 Static Site Deployment (GitHub Pages)

You can export your question bank as a static site that can be hosted on GitHub Pages or any static hosting service.

1.  **Build the site:**
    ```bash
    ./build.sh --base /your-repo-name/
    ```
2.  **Deploy:** Upload the contents of `client/dist` to your hosting provider.

*Note: The static version is **Read-Only**. Adding or editing questions requires running the full application locally.*

## 🧪 Testing

Maintain quality by running the automated test suites:

*   **Backend:** `cd server && npm test`
*   **Frontend:** `cd client && npm test`

## 📖 Documentation

*   [**User Guide**](./wiki/User-Guide.md)
*   [**Developer Guide**](./wiki/Developer-Guide.md)
*   [**API Reference**](./wiki/API-Reference.md)
*   [**Testing Guide**](./TESTING.md)
*   [**Make It Yourself (Tutorial)**](./MAKE_IT_YOURSELF.md)