# Properties Management - View Features & Sorting

## Overview

The Properties management page (`/dashboard/cmt/properties`) has been enhanced with powerful viewing options, search capabilities, and sorting features to help CMT users efficiently manage their properties.

---

## Features

### 1. View Modes

#### 📋 List View
**Default view providing detailed property information in a structured table format.**

**Features:**
- Table layout with columns: Name, Address, Units, Actions
- One property per row
- Sortable data columns (via sort control)
- Unit count displayed as badge
- Hover effects on rows
- Action buttons for Generate Units and View Units

**Best for:**
- Quick scanning of multiple properties
- Finding specific properties by attributes
- Bulk operations
- Data-heavy workflows

**Example:**
```
┌─────────────────────────────────────────────────────────────┐
│ Property Name  │ Address              │ Units  │ Actions     │
├─────────────────────────────────────────────────────────────┤
│ Tower A        │ 123 Main St, City    │ 270    │ [Generate]  │
│ Tower B        │ 456 Oak Ave, City    │ 180    │ [View]      │
│ Villa Complex  │ 789 Pine Rd, City    │ 45     │ [Generate]  │
└─────────────────────────────────────────────────────────────┘
```

#### 📊 Kanban View
**Card-based grid layout providing visual overview of all properties.**

**Features:**
- Responsive grid (3 columns on desktop, 2 on tablet, 1 on mobile)
- Card layout with property details
- Visual unit count badge (top right)
- Landlord information displayed
- Blue left border for visual hierarchy
- Action buttons (Generate Units, View Units)
- Hover effects with shadow expansion

**Best for:**
- Visual browsing of properties
- Getting a quick overview
- Mobile devices
- Presentations or client meetings

**Card Layout:**
```
┌─────────────────────────────────┐
│ Property Name      [270 units]  │
│                                 │
│ 123 Main St, City               │
│ 👤 Landlord Name               │
│                                 │
│ [🏗️ Generate Units]            │
│ [👁️ View Units]                │
└─────────────────────────────────┘
```

---

### 2. Search Functionality

**Search bar at the top of the controls panel.**

**Capability:**
- Search by property name (case-insensitive)
- Search by address (case-insensitive)
- Real-time filtering as you type
- Works with both List and Kanban views

**Examples:**
| Search Query | Matches |
|---|---|
| `Tower` | "Tower A", "Tower Plaza" |
| `Main St` | "123 Main St, Downtown" |
| `apartment` | "Green Apartment Complex" |

**Usage:**
```
Search Input: "Main"
Results: Any property with "Main" in name or address
```

**Performance:**
- Instant filtering (useMemo optimization)
- No API calls required (client-side filtering)
- Filters are combined with sort and view type

---

### 3. Sorting Options

**Sort dropdown with four predefined sort options.**

#### Available Sort Orders

| Sort Option | Order | Use Case |
|---|---|---|
| **Name (A-Z)** | Alphabetical ascending | Find properties by name quickly |
| **Name (Z-A)** | Alphabetical descending | Browse in reverse alphabetical order |
| **Units (High to Low)** | Descending by unit count | Focus on largest properties first |
| **Units (Low to High)** | Ascending by unit count | Focus on smaller properties first |

**Example:**

**Name (A-Z) Sort:**
```
1. Apartment Complex
2. Residential Tower
3. Villa Park
4. Waterfront Homes
```

**Units (High to Low) Sort:**
```
1. Tower A (270 units)
2. Tower B (180 units)
3. Tower C (120 units)
4. Villa Complex (45 units)
```

**Implementation:**
- Sorting is applied after search filtering
- Default sort: Name (A-Z)
- Works independently of view mode
- Sorts by actual unit count from database

---

## Control Panel

Located at the top of the properties section, the control panel contains:

```
┌─────────────────────────────────────────────────────────────────────┐
│ CONTROL PANEL                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Search Properties [_______________] Sort By [Name (A-Z) ▼]        │
│                                      [📋 List] [📊 Kanban]          │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Components

**Search Input**
- Placeholder: "Search by name or address..."
- Icon indicator (optional in future)
- Clear on blur

**Sort Dropdown**
- 4 predefined options
- Default: Name (A-Z)
- Updates immediately on selection

**View Toggle Buttons**
- 📋 List (table view)
- 📊 Kanban (card grid)
- Active button highlighted in blue
- Inactive buttons in gray

---

## User Workflows

### Workflow 1: Find a Specific Property

**Scenario:** Need to quickly locate "Tower A" to update units

**Steps:**
1. Type "Tower A" in search box → Results filter instantly
2. Property appears in current view (List or Kanban)
3. Click "View Units" or "Generate Units"

### Workflow 2: Review All Large Properties

**Scenario:** Need to check which properties have most units

**Steps:**
1. Change Sort to "Units (High to Low)"
2. Switch to List view for detailed comparison
3. Scan the "Units" column to see rankings
4. Properties are sorted by unit count in descending order

### Workflow 3: Mobile Property Browsing

**Scenario:** Using mobile device to review properties

**Steps:**
1. Switch to Kanban view (better for mobile)
2. Grid adjusts to 1 column on mobile
3. Scroll through cards
4. Use search to narrow down results if needed

### Workflow 4: Name-based Organization

**Scenario:** Want to see properties in alphabetical order

**Steps:**
1. Select "Name (A-Z)" from sort dropdown
2. Properties automatically reorganize alphabetically
3. Works in both List and Kanban views

---

## Technical Details

### Performance Optimizations

**useMemo Hook**
```typescript
const filteredAndSortedProperties = useMemo(() => {
  // Filters by search query
  // Sorts by selected sort option
  // Recomputes only when dependencies change
}, [properties, searchQuery, sortBy]);
```

**Why it matters:**
- Filtering/sorting happens locally (no API calls)
- Recomputes only when search, sort, or properties change
- Smooth UX even with hundreds of properties

### State Management

```typescript
const [searchQuery, setSearchQuery] = useState('');
const [sortBy, setSortBy] = useState<SortBy>('name-asc');
const [viewType, setViewType] = useState<ViewType>('list');
```

**Each state independently:**
- Updates view immediately
- Persists during session (lost on page reload)
- Works together to provide unified experience

---

## Responsive Design

### Breakpoints

| Device | List View | Kanban Grid |
|---|---|---|
| Mobile (< 768px) | Table scrolls horizontally | 1 column |
| Tablet (768px - 1024px) | Full table | 2 columns |
| Desktop (> 1024px) | Full table | 3 columns |

**Mobile Optimization:**
- Touch-friendly button sizes (44px minimum)
- Large input fields for touch input
- Kanban view cards stack vertically
- Search is prominently displayed

---

## Styling & Branding

### Colors Used

**Brand Blue (#2DB5DA)**
- Active view toggle button
- Sort dropdown
- Table headers
- Card left borders
- Unit count badges

**Brand Gray (#939598)**
- Property address text
- Inactive buttons
- Secondary information

**Brand Dark (#303036)**
- Property names
- Action button text
- Table content

### Hover Effects

- Row hover: Light blue background (List view)
- Card hover: Shadow expansion (Kanban view)
- Button hover: Darker shade of button color
- All transitions: 150-200ms smooth

---

## Future Enhancements

### Potential Features

1. **Filters**
   - Filter by landlord
   - Filter by unit count range
   - Filter by property type

2. **Advanced Sorting**
   - Sort by date created
   - Sort by landlord name
   - Custom sort order

3. **Additional Views**
   - Timeline view (properties by creation date)
   - Map view (properties on map)
   - Calendar view (properties by lease renewal)

4. **Bulk Operations**
   - Select multiple properties
   - Bulk generate units
   - Bulk export data

5. **Favorites/Starred Properties**
   - Mark properties as favorites
   - Quick filter to show only favorites
   - Reorder by favorites

6. **Advanced Search**
   - Search by landlord name
   - Search by unit count range
   - Boolean operators (AND, OR)

7. **Saved Views**
   - Save search + sort combinations
   - Quick access to common views
   - Shared view templates

---

## Troubleshooting

### Issue: Search not finding properties

**Solution:** Check spelling and make sure search term appears in property name or address. Search is case-insensitive.

### Issue: Sort not applying correctly

**Solution:** Confirm sort option is selected in dropdown. Sort applies to filtered results (search + sort combined).

### Issue: View toggle not working

**Solution:** Ensure you have properties in the list (search result is not empty). Try clearing search to see all properties.

### Issue: Unit count not displaying

**Solution:** Unit count is 0 if no units have been generated yet. Generate units to see the count update.

---

## Keyboard Shortcuts (Future)

Potential keyboard shortcuts for power users:

- `Ctrl+K` - Focus search
- `Ctrl+L` - Switch to List view
- `Ctrl+B` - Switch to Kanban view
- `Ctrl+1-4` - Select sort option 1-4

*Note: Not currently implemented, listed for future consideration.*

---

## Browser Compatibility

✅ Fully supported on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Analytics Events (Future)

Potential events to track:

- View toggle: List ↔ Kanban
- Search: Query length, results count
- Sort: Option selected
- Property interaction: Generate, View Units

---

## Support & Feedback

For issues or feature requests:
1. Check this documentation first
2. Review the PROPERTIES_BULK_GENERATOR_TESTING.md for additional context
3. Check GitHub issues: https://github.com/omaralnoori2/justenant/issues

---

**Last Updated:** 2026-03-07
**Feature Version:** 1.0
**Status:** ✅ Live on main branch

