# Past Question Knowledge Base - Development Plan

## Status: Implemented ✅

## Objective
Build a hierarchical "Knowledge Base" for managing past exam questions, organized by **Course**. The system emphasizes study/revision (not just browsing images) and supports adding unlimited courses.

## Tech Stack
*   **Frontend:** React (Vite) + Tailwind CSS (Clean, data-dense UI).
*   **Backend:** Node.js (Express).
*   **Database:** SQLite (Relational, ideal for `Course -> Question` structure).
*   **Storage:** Local file system for images.

## Features Implemented

### 1. Data Structure (SQLite)
*   **Courses:** Organize questions by subject (e.g., "Math 101").
*   **Questions:** Contain image, notes, references, difficulty level.
*   **Solutions:** Separate entity linked to questions, hidden by default.
*   **Tags:** searchable keywords.

### 2. User Interface (UI) - "No Gallery" Approach
*   **Sidebar Navigation:** Quick access to all courses.
*   **Course View:** List of questions with search/filter capabilities.
*   **Study View:** 
    *   Prominent Question display.
    *   "Reveal Solution" button (spoiler mode).
    *   Notes & References sidebar.

### 3. Static Site Export
*   **Database Export:** Script to convert SQLite data into static JSON files.
*   **Read-Only Mode:** UI automatically hides editing features in static builds.
*   **Asset Management:** Automated bundling of uploads and assets for deployment.
*   **Deployment Ready:** Includes `404.html` and `.nojekyll` for GitHub Pages.

## How to Run

### 1. Start the Backend (Server)
Open a terminal in `past-question-manager/server` and run:
```bash
cd past-question-manager/server
npm start
```
The server runs on `http://localhost:5000`.

### 2. Start the Frontend (Client)
Open a **new** terminal in `past-question-manager/client` and run:
```bash
cd past-question-manager/client
npm run dev
```
The application will open at `http://localhost:5173`.

## Future Enhancements
*   Rich text editor for notes.
*   Export to PDF.
*   Spaced repetition scheduling.