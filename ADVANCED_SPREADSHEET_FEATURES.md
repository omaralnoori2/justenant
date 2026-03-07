# Advanced Spreadsheet Features - Implementation Plan

## Overview

Based on your requirements, the spreadsheet view will be enhanced with professional property management features:

1. ✅ Unit Code column (e.g., A101, B201)
2. ✅ Compound header with logo, name, and address (centered)
3. ✅ Sortable column headers
4. ✅ Kanban view for individual units (not compounds)
5. ✅ Bulk edit and delete functionality
6. ✅ Pagination with configurable rows per page (10, 30, 50, 100, 200, 500)

---

## 1. Unit Code Column

**What it does:**
- Extracts unit code from unit name
- Format: `[Tower/Area Letter][Unit Number]`
- Examples:
  - "Flat 101 Tower A" → `A101`
  - "Flat 301 Tower B" → `B301`
  - "Villa 102 Area C" → `C102`

**Column Position:**
```
Unit Code | Unit Name | Tower/Area | Floor/Block | Tenant | Landlord
   A101   | Flat 101  | Tower A    |      1      |   —    |    —
   A102   | Flat 102  | Tower A    |      1      |   —    |    —
   B201   | Flat 201  | Tower B    |      2      |   —    |    —
```

---

## 2. Compound Header Display

**Current:** Simple text header with unit count badge
**New:** Professional header with:
- Compound logo (small image before name)
- Compound name (centered, large, bold)
- Address (centered, smaller, gray)
- Unit count badge and Generate button

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│                                                      │
│         [Logo] Bag Test                              │
│                test1                                 │
│                                                      │
│        [30 units] [+ Generate]                       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 3. Sortable Column Headers

**Feature:**
- Click any column header to sort
- First click: ascending (A→Z)
- Second click: descending (Z→A)
- Visual indicator (↑ or ↓) on active sort column

**Sortable Columns:**
- Unit Code (A101, A102, A103...)
- Unit Name (Flat 101, Flat 102...)
- Tower/Area (Tower A, Tower B...)
- Floor/Block (1, 2, 3...)
- Tenant (alphabetically)
- Landlord (alphabetically)

**Example Header:**
```
Unit Code↑ | Unit Name | Tower/Area | Floor/Block↓ | Tenant | Landlord
(sorted)   |           |            |  (sorted)    |        |
```

---

## 4. Kanban View for Individual Units

**Current:** Kanban shows property cards with embedded units
**New:** Kanban shows individual unit cards

**Unit Card Layout:**
```
┌──────────────────────────────┐
│ Code: A101                   │
│ Flat 101 Tower A             │
│ Floor: 1                     │
│ Tenant: — [Assign]           │
│ Landlord: Property Owner     │
│                              │
│ [Edit] [Delete]              │
└──────────────────────────────┘
```

**Grid:** Responsive (3 cols desktop, 2 cols tablet, 1 col mobile)

---

## 5. Bulk Operations

### 5A. Bulk Select
- Checkbox in first column of each row
- "Select All" checkbox in header
- Counter: "X units selected"

### 5B. Bulk Edit
- Selected rows highlighted
- "Bulk Edit" button appears
- Options:
  - Change unit names (template-based)
  - Change floor/block numbers
  - Assign to tenant

### 5C. Bulk Delete
- "Delete Selected" button
- Confirmation modal: "Delete X units?"
- Shows list of units to be deleted
- Proceeds with deletion after confirmation

**UI Example:**
```
☑ Unit Code | Unit Name | Tower/Area | ...
              (shows)
☐  A101    | Flat 101  | Tower A    | ...
☐  A102    | Flat 102  | Tower A    | ...
☑  B201    | Flat 201  | Tower B    | ...
              (2 selected)

[← Unselect All] [Edit Selected] [Delete Selected]
```

---

## 6. Pagination

### Page Size Selector
**Options:** 10, 30, 50, 100, 200, 500 rows per page
**Default:** 30

### Pagination Controls
**Bottom of table:**
```
Showing 1-30 of 2700 units
[< Prev] [1] [2] [3] ... [90] [Next >]
Rows per page: [10 ▼] [30] [50] [100] [200] [500]
```

**Features:**
- Quick jump to page
- Change rows per page dynamically
- Preserves sort order
- Shows results range

---

## Implementation Details

### State Variables (Already Added)
```typescript
const [columnSort, setColumnSort] = useState({
  column: 'unitCode',
  direction: 'asc'
});
const [itemsPerPage, setItemsPerPage] = useState(30);
const [currentPage, setCurrentPage] = useState(1);
const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
```

### Helper Functions (Already Added)
1. `extractUnitCode()` - Extract code from unit name
2. `handleColumnSort()` - Handle column header clicks
3. `sortUnitsByColumn()` - Sort array by selected column
4. `handleBulkDelete()` - Delete multiple units

### Functions to Add
1. `getPaginatedUnits()` - Return units for current page
2. `handleSelectUnit()` - Toggle unit selection
3. `handleSelectAll()` - Select/deselect all units
4. `handleBulkEdit()` - Open bulk edit modal

---

## UI Components to Update

### 1. Property Header Section
- Add logo image element
- Center name and address
- Improve styling with flex layout

### 2. Table Headers
- Add click handlers for sorting
- Add sort direction indicators (↑↓)
- Add checkbox in first column
- Add Unit Code column

### 3. Table Body
- Add checkboxes in first column
- Add Unit Code column
- Highlight selected rows
- Maintain all existing columns

### 4. Pagination Controls
- Add below table
- Show page selector
- Show rows per page selector

### 5. Bulk Actions
- Add button row when units selected
- Edit Selected button
- Delete Selected button
- Clear Selection button

### 6. Kanban Units Cards
- Convert to show individual units
- Add unit code
- Add tenant assignment
- Add edit/delete buttons

---

## Data Flow

```
Property List
    ↓
Selected Property
    ↓
Fetch All Units for Property
    ↓
Apply Search Filter
    ↓
Apply Column Sort
    ↓
Apply Pagination
    ↓
Display Units Table with Options (Edit, Delete, Bulk Ops)
    ↓
User Selects Units → Bulk Operations Available
    ↓
Edit/Delete/Assign
    ↓
Update Local State & API
```

---

## Examples

### Example 1: Sort by Unit Code

**Input:** Click "Unit Code" header
**Action:** Toggle sort direction
**Result:** Units reorder: A101, A102, A103... (or Z501, Z502, Z503...)

### Example 2: Pagination

**Input:** User views 2700 unit property
**Page 1:** Show units 1-30 (A101-A110, etc.)
**Page 2:** Show units 31-60
**Last Page:** Show remaining units
**Change to 100:** Page 1 shows units 1-100

### Example 3: Bulk Delete

**Input:** Select units A101, A102, A103
**Click:** Delete Selected
**Confirm:** "Delete 3 units?"
**Result:** Units deleted, table refreshes

---

## Browser Support

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
✅ Mobile browsers

---

## Performance Considerations

- Pagination: Reduces DOM elements (max 500 per page)
- Sorting: Client-side (fast, no API call)
- Selection: Uses Set<string> (efficient lookup)
- Rendering: Only visible rows rendered

---

## Future Enhancements

1. Export to CSV (selected or all units)
2. Bulk import from CSV
3. Advanced filter UI
4. Column visibility toggle
5. Column reordering (drag & drop)
6. Freeze header rows while scrolling
7. Double-click to edit inline
8. Keyboard shortcuts (arrow keys, space to select)

---

## Status

✅ State & Helpers: **COMPLETE** (Commit: 7825057)
⏳ UI Components: **IN PROGRESS**
⏳ Integration: **PENDING**
⏳ Testing: **PENDING**

---

## Next Steps

1. Update property header (logo, name, address)
2. Update table headers (sortable, checkboxes)
3. Add Unit Code column
4. Add pagination controls
5. Implement bulk operations UI
6. Update Kanban for individual units
7. Test all features
8. Deploy

