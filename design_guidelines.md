# Design Guidelines: German Ticket System

## Design Approach

**Selected Approach:** Design System (Utility-Focused)  
**Primary Reference:** Linear's modern ticket management aesthetics + Material Design component patterns  
**Justification:** Enterprise productivity tool requiring efficient data handling, forms, and dashboards. Prioritizes usability, clarity, and performance over visual flair.

## Core Design Principles

1. **Information Clarity:** Dense data presented without visual clutter
2. **Efficient Workflows:** Minimal clicks, clear hierarchy, fast scanning
3. **Role-Appropriate Interfaces:** Agent dashboard ≠ Customer portal in complexity
4. **Systematic Consistency:** Predictable patterns reduce cognitive load

## Typography

**Font Stack:** Inter (primary), System UI fallback
- **Headlines:** text-2xl to text-4xl, font-semibold (600)
- **Section Titles:** text-lg to text-xl, font-medium (500)
- **Body Text:** text-base (16px), font-normal (400), leading-relaxed
- **Metadata/Labels:** text-sm, font-medium, uppercase tracking-wide for labels
- **Tables/Data:** text-sm, font-mono for IDs/codes, font-normal for content

## Layout System

**Spacing Units:** Tailwind 2, 4, 6, 8, 12, 16 units
- Component padding: p-4, p-6
- Section spacing: space-y-8, space-y-12
- Card gaps: gap-4, gap-6
- Page margins: max-w-7xl mx-auto px-6

**Grid Strategy:**
- Dashboard: 3-4 column grid for stats (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Ticket lists: Single column with subtle dividers
- Forms: 2-column for efficiency (grid-cols-1 md:grid-cols-2)
- Main layout: Sidebar (240px fixed) + Content area (flex-1)

## Component Library

### Navigation
- **Fixed Sidebar:** 240px width, hierarchical menu structure
- **Top Bar:** Breadcrumbs, search, user profile, notifications
- **Tabs:** Underline style for ticket detail sections (Details, Comments, Activity, Files)

### Ticket Management
- **Ticket Card:** Compact view with ID, title, status badge, priority indicator, assignee avatar
- **Ticket Detail:** Split view - left (metadata, fields, timeline), right (comments, attachments)
- **Status Badges:** Rounded-full px-3 py-1 text-sm with status-specific treatments
- **Priority Indicators:** Color-coded dots or small flags

### Forms & Inputs
- **Text Inputs:** h-10 rounded-lg border with focus ring
- **Dropdowns:** Custom select with search capability for assignees, tags
- **Multi-select:** Chip-based selection for watchers, tags
- **Rich Text Editor:** Minimal toolbar for comments (bold, italic, list, link, file)
- **File Upload:** Drag-drop zone with preview thumbnails

### Data Display
- **Tables:** Alternating row backgrounds, sticky headers, sortable columns
- **Dashboards:** Card-based widgets with metric + trend + chart
- **Timeline:** Vertical timeline for ticket activity history
- **Lists:** Clean lists with hover states, checkbox selection for bulk actions

### Customer Portal
- **Simplified Layout:** No sidebar, centered content max-w-4xl
- **Minimal Navigation:** Top bar only with logo, ticket overview, profile
- **Ticket Submission:** Step-by-step form with clear progress indicator
- **Status View:** Large status badge, timeline of updates, comment section

### Interactive Elements
- **Buttons:** Primary (bg-blue-600), Secondary (border), Ghost (hover:bg-gray-100)
- **Avatar Groups:** Overlapping circles for multiple assignees (max 3 visible + count)
- **Mentions:** @-mention autocomplete dropdown
- **Action Menus:** Three-dot menu for ticket actions (edit, delete, duplicate)

## Responsive Behavior

**Mobile (< 768px):**
- Sidebar collapses to hamburger menu
- Single-column layouts throughout
- Bottom navigation bar for primary actions
- Swipe gestures for ticket navigation

**Tablet (768-1024px):**
- Collapsible sidebar
- 2-column forms
- Touch-optimized hit targets (min 44px)

**Desktop (> 1024px):**
- Fixed sidebar always visible
- Multi-column dashboards
- Hover states for additional context
- Keyboard shortcuts prominently displayed

## Images

**Hero Image:** None - this is a utility application, not a marketing site. Focus on immediate functionality.

**In-App Imagery:**
- **Placeholder Avatars:** Colorful initial-based avatars for users without photos
- **Empty States:** Simple illustrations for "No tickets yet", "No results found" (use lucide icons, not custom illustrations)
- **File Attachments:** Preview thumbnails for images, icon representations for documents

## Animation (Minimal)

- **Transitions:** Fast transitions (150ms) for hover, active states
- **Loading:** Skeleton screens for ticket lists, spinner for actions
- **Notifications:** Slide-in toast from top-right corner
- **No Decorative Animations:** Performance and professionalism over delight

## Key Page Layouts

**Agent Dashboard:** 4-stat cards → ticket queue table → activity feed (right sidebar)  
**Ticket Detail:** 70/30 split (main content / metadata sidebar)  
**Customer Portal:** Centered single column, hero section with "Create Ticket" CTA  
**Reports:** Filter sidebar (left) + chart/table area (main)

## German Language Considerations

- Longer button labels anticipated (e.g., "Ticket erstellen" vs "Create ticket")
- Use flex layouts with text truncation for compact views
- Adequate button padding to accommodate text length