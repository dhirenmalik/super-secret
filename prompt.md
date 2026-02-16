# Prompt to Recreate This Project

> Use this prompt with an AI coding assistant to rebuild the entire Walmart ETL & EDA web interface from scratch.

---

## Prompt

Create a modular, visually polished web interface using **React + Vite (JavaScript)** for a Walmart Data ETL & EDA process management tool. No backend implementation — only leave placeholder API stubs. The frontend must be fully functional with a consistent **Walmart blue** color theme throughout.

### Data Source

The app manages **11 sequential steps** from a "Data ETL & EDA" process. Here is the structured data for all steps:

| # | Step Name | Phase | Tasks | Automation Notes |
|---|-----------|-------|-------|-----------------|
| 1 | **Data Staging** | ETL | 1. Login to VDI (Walmart cloud) · 2. Run queries specific to category · 3. Data download | Due to large data files queries forcefully stopped · Need to split time period to pull data files · Multiple data files need to pull (Weekly, Daily, Monthly) |
| 2 | **Data Pull** | ETL | 1. Upload files from VDI to IG's cloud · 2. Download data from cloud to local systems | No access or authority to work directly on client's cloud or internal cloud |
| 3 | **Data Platform Connection** | ETL | Multiple times download & upload data | If we can get DB access on client site, we can fully automate it |
| 4 | **Kick-off Report** | EDA | 1. Develop report based on categories & sub-categories, their co-relations, sales/units/spends etc · 2. Suggest model groups to decide | — |
| 5 | **Kick-off Report Review** | EDA | 1. Review model groupings · 2. Discuss L2/L3 sub-categories to shift internally | Model groupings can be excluded/combined · Discussions on L2/L3s to shift internally · Dependency on Walmart to finalise model groups |
| 6 | **Exclude Flag Analysis** | EDA | Standardized template to consolidate brands using historical FY24–FY26 mappings and exclude private/mapping-issue brands | To check recommendations from agent to confirm the exclusion & inclusion of brands |
| 7 | **Exclude Flag Review** | EDA | Confirm brands to be considered, combined or excluded for relevant sales & spends coverage | Confirmation on brands · Dependency on Walmart to finalise brands to be included in modeling |
| 8 | **Brand Stacks Creation** | EDA | 1. Create Total category stack · 2. Create aggregated brand stack (Data prep for modeling) | — |
| 9 | **Discovery Tool Analysis** | EDA | Create report with trends, charts, comparison with Raw data at total and Variable level | — |
| 10 | **Tool Review** | EDA | 1. Customisation – Merge or remove tactics · 2. Manual calculations to adjust data due to data discrepancy · 3. Capping of any peak in any particular variable | Dependency on Walmart to make calculations to rectify irregular trends at tactic level |
| 11 | **EDA Email Report** | EDA | Generated through notebook to create and populate all six tables and key insights in WMC fixed format, reducing manual effort and turnaround time | — |

### Architecture Requirements

1. **Project structure** — highly modular:
   ```
   src/
   ├── api/index.js           → Placeholder backend stubs (fetchStepStatus, updateTaskStatus, uploadFile, runQuery, generateReport, testConnection, fetchBrands, updateBrandStatus, fetchPipelineStatus)
   ├── components/            → Reusable UI components
   │   ├── Layout.jsx         → App shell (sidebar + content)
   │   ├── Sidebar.jsx        → Navigation with ETL/EDA phase grouping, active step highlighting, mobile toggle
   │   ├── PageHeader.jsx     → Breadcrumb, step number badge, title, subtitle, phase tag
   │   ├── StatusBadge.jsx    → Pill badge (Not Started / In Progress / Completed / Blocked)
   │   ├── TaskList.jsx       → Checkbox task list with progress bar
   │   ├── AutomationNote.jsx → Yellow callout card for automation opportunities
   │   └── StepCard.jsx       → Clickable card for dashboard grid
   ├── pages/                 → One page per step + Dashboard
   ├── data/steps.js          → All 11 steps as structured JSON array
   ├── theme/theme.js         → Central design tokens
   ├── App.jsx                → React Router routes
   ├── App.css                → Full design system (CSS custom properties)
   └── main.jsx               → Entry point with BrowserRouter
   ```

2. **Routing** — React Router v6:
   - `/` → Dashboard
   - `/step/data-staging` → Step 1
   - `/step/data-pull` → Step 2
   - `/step/data-platform-connection` → Step 3
   - `/step/kickoff-report` → Step 4
   - `/step/kickoff-report-review` → Step 5
   - `/step/exclude-flag-analysis` → Step 6
   - `/step/exclude-flag-review` → Step 7
   - `/step/brand-stacks-creation` → Step 8
   - `/step/discovery-tool-analysis` → Step 9
   - `/step/tool-review` → Step 10
   - `/step/eda-email-report` → Step 11

### Design System

- **Primary color**: Walmart Blue `#0071DC`
- **Sidebar**: Dark navy gradient `#001F3F` → `#00152B`
- **Secondary accent**: Walmart Yellow `#FFC220`
- **Surface**: `#F4F7FB`, Cards: `#FFFFFF`
- **Typography**: Inter from Google Fonts (weights: 300–800)
- **Shadows, borders, radius**: Use CSS custom properties for consistency
- **Status colors**: Success `#22C55E`, Warning `#F59E0B`, Danger `#EF4444`, Info `#3B82F6`
- **Animations**: Fade-in page transitions, pulsing status dots, hover lifts on cards
- **Responsive**: Sidebar collapses on mobile (<1024px) with hamburger toggle and overlay

### Page-Specific UI Elements

Each step page must have **unique, contextual UI** beyond just the task list:

| Step | Unique UI Elements |
|------|--------------------|
| 1 - Data Staging | SQL query textarea with category dropdown, file upload drag-drop area, file status table (Weekly/Daily/Monthly) |
| 2 - Data Pull | VDI→Cloud and Cloud→Local transfer progress bars, file download queue table with individual download buttons |
| 3 - Data Platform Connection | Database connection form (type, host, database, username, password), Test Connection button, connection status empty state |
| 4 - Kick-off Report | Category & sub-category dropdowns, metric checkboxes (Sales/Units/Spends/Co-Relations), chart placeholder for report preview |
| 5 - Kick-off Report Review | Review comments textarea, model group table with toggle switches for include/exclude, sub-category tags |
| 6 - Exclude Flag Analysis | Brand summary stats (total/included/excluded), brand table with FY24/FY25/FY26 mapping status pills, sales% & spends% columns, toggle switches |
| 7 - Exclude Flag Review | Coverage metrics cards, brand confirmation table with Include/Combine/Exclude action badges, Approve/Request Changes/Reject buttons |
| 8 - Brand Stacks Creation | Stack type selector, aggregation level dropdown, date range pickers, stack output preview table |
| 9 - Discovery Tool Analysis | Variable checkbox list, analysis level selector, two chart placeholder cards (Time Series + Comparison) |
| 10 - Tool Review | Tactic merge/remove multi-select, interactive range sliders for peak capping per variable, manual adjustment formula input |
| 11 - EDA Email Report | One-click generate button with loading spinner animation, 6-table status grid with checkmarks, email preview card that populates after generation |

### Dashboard Page

- **Stats row**: 4 cards (Total Steps, Total Tasks, ETL Steps, EDA Steps)
- **Pipeline progress bar**: Shows overall completion
- **Step cards grid**: Organized under "ETL" and "EDA" section headers, each card shows step number, name, task count, automation notes count, phase tag, and "View →" link
- Cards have hover lift animation with top blue gradient border reveal

### Placeholder API Module

Export async functions that simulate delays and return mock data:
- `fetchStepStatus(stepId)` → `{ stepId, status, progress }`
- `updateStepStatus(stepId, status)` → `{ success: true }`
- `updateTaskStatus(stepId, taskId, completed)` → `{ success: true }`
- `uploadFile(file)` → `{ success, fileId, name }`
- `downloadFile(fileId)` → `{ success, url }`
- `runQuery(query)` → `{ success, rows, message }`
- `generateReport(stepId, params)` → `{ success, reportId, message }`
- `testConnection(config)` → `{ success, message }`
- `fetchBrands(categoryId)` → `{ brands: [...] }` with mock brand objects
- `updateBrandStatus(brandId, status)` → `{ success: true }`
- `fetchPipelineStatus()` → `{ totalSteps, completed, inProgress, blocked }`

Each stub should have a `// TODO: connect to backend` comment.

### Key UX Details

- Sidebar nav items have active state with left blue bar indicator and highlighted step number
- TaskList checkboxes are interactive — clicking toggles completion and updates the progress bar
- Toggle switches on brand/model tables are functional (local state)
- Capping sliders on Tool Review page update values in real-time
- EDA Email Report generate button shows a spinner, then transitions to success state with populated email preview and green checkmarks on all 6 tables
- All pages use the `PageHeader` component with breadcrumbs, step number badge, and status badge
- Page content fades in with a subtle translateY animation on route change
