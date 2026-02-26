# User Guide

## 1. Getting Started
The **Dashboard** is your home base.

### Installation & Startup
Before using PQM for the first time, you must install the dependencies:
*   **Linux**: Run `./install-linux.sh` in your terminal.
*   **macOS**: Run `./install-mac.sh` in your terminal.
*   **Windows**: Double-click the `install.bat` file.

To start the application:
*   **Linux/macOS**: Run `./start.sh`.
*   **Windows**: Double-click `start-windows.bat`.

Once started, open your browser to `http://localhost:5173`. If you are on the same WiFi network, you can also access it on your phone using the **LAN IP** displayed in the terminal.

### Stats Overview: See your total courses, questions, and how many are solved/unsolved at a glance.
*   **Your Courses:** Quick access cards to all your subjects.
*   **Recently Added:** Jump back into questions you just uploaded.
*   **Needs Solutions:** A list of questions that don't have answers yet—great for study sessions!

## 2. Managing Courses
Everything in PQM starts with a **Course**.
*   **Create a Course:** Click the **"+ Add Course"** button in the sidebar. Enter a code (e.g., `MATH101`) and a title (e.g., `Calculus I`).
*   **Edit or Delete:** Click the **Settings (gear)** icon at the bottom of the course list in the sidebar to enter **Edit Mode**. Click the pencil icon next to a course to edit details or delete it.
*   **Reorder Sidebar:** In **Edit Mode**, you can drag courses to your preferred order. Click **"Save New Order"** when finished.
*   **View a Course:** Click on any course card on the dashboard or name in the sidebar.

## 3. Adding Questions
Inside a course view, click the **"+ Add Question"** button.
*   **Title & Year:** Mandatory fields to identify the question.
*   **Difficulty:** Select from **Easy, Medium, Hard, or Undefined**. This helps you categorize and filter questions.
*   **Question Type:** Categorize questions as **Semester, Midterm, Class Test, Quiz, Assignment, or Book Question**. Choose **"Other"** to enter a custom category.
*   **Images:** 
    *   **Drag & Drop** multiple images onto the uploader.
    *   **Paste (Ctrl+V)** images directly from your clipboard.
    *   Click the **"+"** card to browse files.
*   **Tags:** Add comma-separated tags (e.g., `Integration, Hard`).
*   **Notes:** Optional text content for the question.

## 4. Multi-Page Questions
If you upload multiple images during creation, the system automatically creates a multi-page question.
You can also add more pages later:
1.  Open the question.
2.  Scroll to the bottom of the "Question" section.
3.  Click **"Add another part to this question"**.

## 5. Adding & Viewing Solutions
Solutions are hidden by default to help you study.
1.  Click the big **"Reveal Solution"** button.
2.  **Tabbed Solutions:** If multiple solutions exist (e.g., different methods), you'll see tabs at the top. Click a tab to switch between them.
3.  **Add/Edit Solutions:** 
    *   Click **"Add Solution"** or **"Add Another Alternative Solution"**.
    *   Give each solution an optional **Title** (e.g., "Short Method") to label the tabs.
    *   Solutions support multiple images and text, just like questions.
    *   Use the hover icons (pencil/trash) on any solution part to modify it.

## 6. Search & Sort
*   **Search:** Use the search bar in a Course page to find questions by title, content, or tags.
*   **Triple View Toggle:** Switch between views using the icons in the top right:
    *   **List View:** High-density list for rapid scanning.
    *   **Group View:** Organizes questions into folders by **Year**.
    *   **Card View:** Large previews for a visual gallery experience.
*   **Dynamic Filtering:**
    *   **Clickable Metadata:** Click any **Tag, Type, or Difficulty Badge** on a question to instantly filter the view.
    *   **Smart Filter Clouds:** 
        *   Select **"By Tags"** in the sort dropdown to reveal the **Course Filter Tags**.
        *   Select **"By Year"** in the sort dropdown to reveal the **Course Filter Years**.
        *   Select **"By Type"** in the sort dropdown to reveal the **Course Filter Types**.
    *   **Multi-Select:** You can select multiple years, tags, and types simultaneously to narrow down your study material.
    *   **Reset All:** Use the "Reset All Filters" button to clear all selections at once.
*   **Export to PDF:** Click the **"Export PDF"** button to generate a printable document of your currently filtered questions. This is perfect for offline study or creating physical practice sets.
*   **Sort:** Use the dropdown to sort by **Year, Type, Difficulty, Date Added, Title, or Tags**.
*   **Progress Tracker:** Check the progress bar in the course header to see your study completion rate (Solved vs. Unsolved).

## 7. QOL Features
*   **Themes:** Click the palette icon in the header to switch between **Default, Light, Dark, AMOLED, Paper, and Midnight** themes.
*   **Focus Mode:** Press **'F'** or click the expand icon in the header to hide the sidebar and focus solely on the question content.
*   **Quick Search:** Press **'Ctrl+K'** or **'Cmd+K'** at any time to instantly focus the search bar.
*   **Share Link:** Use the **"Share"** button on any question page to copy its direct local URL to your clipboard.
*   **Study Timer:** Click the clock icon in the header to start a timer for your study session. Click the 'X' to reset it.

## 🌐 Static Site Deployment
You can share your question bank with others by deploying it as a static website (e.g., to GitHub Pages).

1.  **Build:** Run `./build.sh --base /your-repo/` in your terminal.
2.  **Hosting:** Upload the `client/dist` folder to your host.
3.  **Read-Only:** The shared site will be **Read-Only**. Visitors can browse and study your questions but cannot add or edit them.