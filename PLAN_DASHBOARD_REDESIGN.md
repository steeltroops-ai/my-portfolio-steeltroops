# Admin Dashboard Redesign Plan

## Objective

Redesign the existing Admin Dashboard to create a focused, professional workspace. The new layout will feature a **persistent, transparent sidebar** for navigation and global settings, and a **Main Content Area** centered around an AI-first creation workflow (ChatGPT-style input).

## Design Specs

### 1. Sidebar (Navigation & Settings)

- **Position**: Fixed Left.
- **Visual Style**:
  - Transparent / Glassmorphism (`backdrop-blur-md`, low opacity styling).
  - **Shape**: Rounded corners on the _right side only_ (top-right and bottom-right), giving it a distinctive "floating panel" look.
  - **Collapsible**: Ability to collapse to icons-only.
- **Content**:
  - **Header**: Branding / Logo.
  - **Navigation Links**:
    - **Dashboard** (Overview).
    - **Messages** (Inbox).
  - **Settings Section** (Bottom/Panel):
    - **Button**: Settings (Opens a panel or expands inline).
    - **Toggle**: "Auto-save Drafts" (Global preference).
  - **Footer**: **Logout** Button.

### 2. Main Content Area (The Workspace)

- **Layout**: Takes up the remaining width.
- **Focus**: The "Create" experience is central.
- **AI Input Station (Sticky Bottom)**:
  - Located at the bottom of the main content view (like ChatGPT/Claude).
  - **Visuals**: Highly polished, glassmorphism container floating slightly above the bottom edge.
  - **Input Field**: Large, auto-expanding text area.
  - **Configuration Pills/Options** (Above or inside the input container):
    - **Writing Style** (e.g., "Professional", "Casual", "Technical").
    - **Article Length** (e.g., "Short", "Medium", "Deep Dive").
    - **Target Audience** (e.g., "Developers", "General", "Enterprise").
    - **Toggle**: "Include Code Examples" (Specific generation parameter).
  - **Action**: "Generate" / Send button.

## Component Restructuring

### New Directory Structure

- `src/features/admin/layouts/AdminLayout.jsx`
  - Wraps the application.
  - Contains the `<Sidebar />` and `<Outlet />` (Main Content).
- `src/features/admin/components/Sidebar/`
  - `Sidebar.jsx`: Main container.
  - `SidebarNav.jsx`: Menu items (Dashboard, Messages).
  - `SidebarSettings.jsx`: The "Auto-save" and global toggles.
- `src/features/admin/components/Creation/` (New Folder for AI workflow)
  - `AICreatorInput.jsx`: The complex ChatGPT-like input component with pills/options.
  - `GenerationOptions.jsx`: The pills for Style, Length, Audience.
- `src/features/admin/components/Dashboard/`
  - `AdminDashboard.jsx`: Stats & Quick Actions (Refactored to remove top nav).

## Implementation Steps

### Step 1: Layout & Sidebar

Build the `AdminLayout` and `Sidebar` first.

- Implement the "Right Rounded" transparent sidebar.
- Add Navigation links (Dashboard, Messages).
- Add Settings toggle for "Auto-save Drafts" in the sidebar.
- Add Logout button.

### Step 2: AI Input Component (The Core UI)

Build the `AICreatorInput` in the Main Area.

- Style it based on the "Claude" input inspiration but use our **Cyan/Purple/Dark** theme.
- Add the "Pills" for _Writing Style_, _Length_, _Audience_, _Code Examples_.
- Ensure it stays fixed at the bottom of the view while content scrolls above it.
- This input will be present on the Dashboard or a dedicated "New Post" page.

### Step 3: Route Integration

- Update `src/main.jsx` to wrap admin routes with `AdminLayout`.
- Update `AdminDashboard` to remove its internal navbar.
- Ensure the `Sidebar` settings (like Auto-save) persist state.

## Visual Detail Structure

```
+------------------+------------------------------------------------------+
| SIDEBAR (Fixed)  | MAIN CONTENT (Scrollable)                            |
| [Rounded Edge >] |                                                      |
|                  |  [ Generated Content / Stream ... ]                  |
| [Logo]           |  [ ...                                ]              |
|                  |  [ ...                                ]              |
| [Nav]            |  [ ...                                ]              |
| - Dashboard      |                                                      |
| - Messages       |                                                      |
| - New post       |                                                      |
  - Ai Genrate
| [Settings]       |                                                      |
|   [x] Auto-save  |                                                      |
|                  |                                                      |
|                  |  +------------------------------------------------+  |
|                  |  |   {                                      }     |  |
|                  |  |  [ Text Input .............................. ] |  |
| [Logout]         |  |  [Style] [Length] [Audience] [x] Code Ex.[ -> ]   |  |
|                  |  +------------------------------------------------+  |
+------------------+------------------------------------------------------+
```
