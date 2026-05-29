# 📊 SmartSpense - Smart Expenses Tracker
SmartSpense is a smart, high-fidelity **Expense Tracker Single Page Application (SPA)** designed with a gorgeous, glassmorphic Material 3 Expressive UI. Built using modern Vanilla JavaScript, HTML5, and CSS3, it offers local state persistence, interactive analytics, budget checks, and data portability. I built this project as an initial step for managing my personal expenses, and eventually create a Siri Automation script that helps me update expenses to this app after I perform a UPI transaction.

---

## ✨ Key Features

1. **Guided Onboarding Spotlight Tour**:
   * A step-by-step interactive onboarding experience that spotlights core features (KPI Cards, forms, budgets, settings, and the ledger).
   * Fully responsive; highlights and positions dynamically adapt during window resizing.

2. **Welcome Sheet Overlay**:
   * A premium welcome card overlay with a blurred backdrop displays on the first load to invite users to start the tour or load mock data.
   * Remembers the user's dismissal state in `LocalStorage` to prevent showing up again on subsequent refreshes.

3. **Dynamic Visual Analytics (Chart.js)**:
   * **Category Spending (Doughnut Chart)**: Visualizes a breakdown of expenses by category with a clean tooltip display showing rupee amount and percentages.
   * **Cash Flow History (Bar Chart)**: Compares Income vs. Expenses chronologically month-over-month.
   * Charts extract color variables directly from the CSS DOM at runtime, aligning with light/dark theme toggles.

4. **Interactive Budget Manager**:
   * Define spending limits per category.
   * Progress bars update in real-time, changing colors dynamically based on percentage utilization:
     * **Green**: Normal spending.
     * **Orange**: Near limit (≥85%).
     * **Neon Red**: Over budget (displays a warning label with the exact overflow amount).

5. **Advanced Ledger (CRUD)**:
   * Full creation, retrieval, updates, and deletion of transactions.
   * Interactive editing scrolls to the form, pre-fills fields, and alters button states dynamically.
   * **Debounced Search**: Instantly filters by title, categories, or notes without lagging the interface.
   * Grouped filtering by categories, transaction type (income/expense), and date range (Current Month, Last Month, All Time, or specific months).

6. **Material 3 Expressive Theme**:
   * Implements M3 container styling, fully rounded capsule buttons (`border-radius: 9999px`), and outlines.
   * Premium typography using **Plus Jakarta Sans** (headings) and **Inter** (body).
   * Smooth theme transitions between **Sleek Dark Mode** (default) and **Light Mode** (mint-green themed).
   * Interactive hover card glow cursor positions calculated in real-time via mouse events.

7. **Data Portability & Porting**:
   * **CSV Export**: Downloads a spreadsheet report of the filtered transaction ledger.
   * **JSON Backup**: Downloads a full database snapshot (transactions + budget configurations).
   * **JSON Restore**: Upload a backup file to restore your entire state instantly.
   * **Factory Reset**: Clears local data and prompts onboarding.

---
**Dynamic Highlights**: Implemented using modern CSS `color-mix()` syntax, allowing highlights, badge borders, and spotlight overlays to dynamically blend with opacity configurations.
---

## 📁 File Structure

```bash
├── index.html        # Semantic HTML structure, Lucide/Chart.js CDNs, and UI chrome
├── styles.css        # Material 3 tokens, layout grids, animations, and transitions
├── app.js            # Core JS state controller, CRUD ledger operations, and onboarding
├── charts.js         # Chart.js interface, dynamic color extraction, and configs
├── seed-data.js      # Relatve date-based mockup transaction database generator
└── .gitignore        # Standard git ignore definitions
```

---

## 🚀 Getting Started

### Prerequisites
SmartSpense is pure front-end client code and requires **no compilation, bundlers, or node packages**. 

### How to Run Locally
1. Simply double-click [index.html](index.html) to open the application directly in any web browser.
2. Alternatively, run a simple local web server to bypass strict origin policies (which may interfere with certain browser cache storage types):
   ```bash
   # Run with Python
   python -m http.server 8000
   ```
   Then open **[http://localhost:8000](http://localhost:8000)** in your browser.

---

## ⚙️ Architecture & Implementation Notes

* **State-Driven Rendering**: Renders follow a uni-directional state flow. Changes in `state` trigger calculations which rebuild transaction lists, update KPI stats, redraw budget progress, and refresh Chart.js canvases.
* **Asset Optimization**: Uses vector icons through the Lucide CDN, avoiding heavy image downloads.
* **Modern CSS Techniques**: Leverage modern styling standards, using CSS Grid/Flexbox layouts, backdrop-filters, custom scrollbars, and `color-mix()` for high performance rendering without heavy utility library overrides.
