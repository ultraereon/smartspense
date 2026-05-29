# 📊 SmartSpense - Smart Expenses Tracker

SmartSpense is a smart, high-fidelity **Expense Tracker Single Page Application (SPA)** designed with a gorgeous, glassmorphic Material 3 Expressive UI. Built using modern Vanilla JavaScript, HTML5, and CSS3, it offers local state persistence, interactive analytics, budget checks, and data portability. I built this project as an initial step for managing my personal expenses, and have now updated it to support Siri Shortcuts to help me automatically update expenses to this app after I perform a UPI transaction.

🔗Link to the app: https://ultraereon.github.io/smartspense/
---

## ✨ Key Features

1. **Guided Onboarding Spotlight Tour**:
   * A step-by-step interactive onboarding experience that spotlights core features (KPI Cards, forms, budgets, settings, and the ledger).
   * Fully responsive; highlights and positions dynamically adapt during window resizing.

2. **Welcome Sheet Overlay**:
   * A premium welcome card experience displays on the first load to invite users to start the tour or load mock data.
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

8. **Siri Shortcuts & Automation Integration**:
   * Log transactions hands-free or with 1-tap using iOS/macOS Siri Shortcuts.
   * Leverages a client-side URL query parameter API to write directly to LocalStorage.
   * Custom Apple-inspired Siri orb animation and status toast on incoming shortcut executions.

---

## 🎨 Theme Specs (Green & Blue Theme)

SmartSpense features a custom-designed Material 3 palette:
* **Primary (Mint Green)**: `#76E0A6` (Dark) / `#006D3C` (Light)
* **Secondary/Tertiary (Blue tones)**: `#9AD0EC` and `#A4C9FF` (Dark) / `#006695` and `#005FAF` (Light)
* **Dynamic Highlights**: Implemented using modern CSS `color-mix()` syntax, allowing highlights, badge borders, and spotlight overlays to dynamically blend with opacity configurations.

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

### Live Access (GitHub Pages)
SmartSpense is hosted live and is mobile-ready (perfect for Siri Shortcut setup):
👉 **[https://ultraereon.github.io/smartspense/](https://ultraereon.github.io/smartspense/)**

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

---

## 📱 Siri Shortcuts & Automation API

SmartSpense includes a built-in serverless URL parameter API that accepts transaction input from external applications like iOS Siri Shortcuts. 

### How it Works
When the hosted web app is opened with specific query parameters, it parses them, commits the transaction to `LocalStorage`, clears the URL query parameters to prevent duplicate entries, and launches a Siri success animation.

### Parameter Schema
| Parameter | Required | Type | Description |
| :--- | :--- | :--- | :--- |
| `action` | **Yes** | String | Must be set to `add-tx` |
| `amount` | **Yes** | Number | The transaction value (e.g., `150.00`) |
| `desc` | **Yes** | String | Title or description (e.g., `Coffee`) |
| `category` | No | String | Case-insensitive category (e.g., `Food`, `Utilities`, `Salary`). Defaults to `Miscellaneous` |
| `type` | No | String | `expense` or `income`. Defaults to `expense` |
| `auto` | No | Boolean | Set to `true` to auto-save silently; `false` to pre-fill the form and review |
| `notes` | No | String | Optional notes/memo content |

### Step-by-Step iOS Shortcut Setup
For convenience, an **interactive setup tutorial and URL generator** is built directly into the SmartSpense sidebar under **Siri Shortcuts**. You can customize the fields, copy the live URL template, and follow the guided instructions to configure your iPhone shortcut in minutes!
