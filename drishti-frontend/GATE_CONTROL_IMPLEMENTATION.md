# Gate Control Page - Implementation Guide

## Overview

The Gate Control Page provides organizers with a comprehensive interface to manage venue gates, monitor crowd levels, and visualize zone accessibility in real-time. This feature is integrated into the Live Operations section of the DrishtiX platform.

## File Created

- **`src/components/GateControlPage.tsx`** - Complete gate control interface with split layout

## Files Modified

- **`src/components/EventCommandCenter.tsx`** - Added gate-control routing and GateControlPage import

## Features Implemented

### 1. Split Screen Layout

- **Left Side**: Interactive venue map showing:

  - Zones as colored polygons with accessibility status
  - Gates as status-coded circular markers
  - Real-time hover tooltips with gate details
  - Visual indicators for inaccessible zones

- **Right Side**: Gate control panel with:
  - Search and filter functionality
  - Individual gate cards with detailed information
  - Quick action buttons (Open/Close)
  - Delete functionality with confirmation

### 2. Gate Status Management

Each gate has three possible states:

- **Open** (Green) - Gate is operational and allowing traffic
- **Closed** (Red) - Gate is closed, blocking access
- **Congested** (Orange) - Gate is open but experiencing high crowd density

### 3. Zone Accessibility Logic

- Zones automatically become inaccessible when ALL their connected gates are closed
- Zone accessibility is recalculated in real-time as gates open/close
- Visual feedback shows inaccessible zones with red borders and background

### 4. Real-Time Features

- **Toast Notifications**: Success/warning messages for all gate operations
- **Zone Impact Summary**: Dynamic panel showing which zones are affected by gate closures
- **Crowd Level Monitoring**:
  - Critical (≥90% capacity)
  - High (≥70% capacity)
  - Moderate (≥40% capacity)
  - Low (<40% capacity)

### 5. Interactive Map

- Click on gates to select and view details
- Hover over gates for quick information tooltip
- Visual representation of zone connectivity
- Color-coded status indicators

## Data Structures

### Gate Interface

```typescript
interface Gate {
  id: string; // Unique identifier
  name: string; // Display name (e.g., "Gate A - Main Entrance")
  status: "open" | "closed" | "congested";
  connectedZones: string[]; // Array of zone names
  throughput: number; // People per hour capacity
  currentCrowd: number; // Current occupancy
  maxCapacity: number; // Maximum capacity
  position: { x: number; y: number }; // Map coordinates (percentage-based)
  lastUpdated: Date; // Timestamp of last status change
}
```

### Zone Interface

```typescript
interface Zone {
  id: string; // Unique identifier
  name: string; // Display name (e.g., "Zone A")
  gates: string[]; // Array of gate IDs
  isAccessible: boolean; // Calculated based on gate status
  color: string; // Hex color for map display
  position: {
    // Rectangle coordinates for rendering
    x: number; // Left position (%)
    y: number; // Top position (%)
    width: number; // Width (%)
    height: number; // Height (%)
  };
}
```

## Key Functions

### `toggleGateStatus(gateId: string)`

- Toggles gate between open/closed states
- Automatically updates currentCrowd to 0 when closing
- Identifies impacted zones
- Triggers toast notification
- Updates lastUpdated timestamp

### `Zone Accessibility Calculation` (useEffect)

```typescript
useEffect(() => {
  const updatedZones = zones.map((zone) => {
    const openGates = zone.gates.filter((gateId) => {
      const gate = gates.find((g) => g.id === gateId);
      return gate && gate.status === "open";
    });

    return {
      ...zone,
      isAccessible: openGates.length > 0,
    };
  });

  setZones(updatedZones);
}, [gates]);
```

### `getCrowdLevel(current: number, max: number)`

Returns crowd level classification with color coding:

- Critical (Red): ≥90% capacity
- High (Orange): 70-89% capacity
- Moderate (Amber): 40-69% capacity
- Low (Green): <40% capacity

## UI Components

### Header Section

- Back navigation button
- Title with door icon
- Live statistics (X Gates Open, Y Gates Closed)

### Map Section (Left)

- Canvas-style map with zones and gates
- Legend showing status colors (Open/Closed/Congested)
- Interactive hover states
- Click-to-select functionality

### Control Panel (Right)

- Search bar with real-time filtering
- Status dropdown filter (All/Open/Closed/Congested)
- Scrollable gate cards with:
  - Gate name and status badge
  - Connected zones display
  - Crowd level indicator
  - Current occupancy progress bar
  - Throughput information
  - Action buttons (Open/Close)
  - Delete button with confirmation

### Zone Impact Summary

Appears when gates are closed showing:

- ✓ Zones that remain accessible via other gates
- ✗ Zones that became inaccessible

### Toast Notifications

- Success (Green): Gate opened successfully
- Warning (Amber): Gate closed successfully
- Error (Red): Gate deleted
- Auto-dismiss after 3 seconds

### Delete Confirmation Modal

- Warning icon and message
- Shows affected zone count
- Cancel/Delete buttons with appropriate styling

## Navigation Integration

### Routing

The gate control page is accessible from the EventSidebar under "Live Operations":

- Route key: `"gate-control"`
- Already defined in EventSidebar.tsx (lines 68-71)
- Integrated into EventCommandCenter switch statement

### Access Path

1. Navigate to Event Command Center (organizer view)
2. Click "Gate Control" in Live Operations section of sidebar
3. Component renders with full access to gate management features

## Mock Data

The component includes 5 pre-configured gates:

1. **Gate A - Main Entrance**: Open, 450/800 capacity, connects to Zone A & B
2. **Gate B - North Entrance**: Open, 320/600 capacity, connects to Zone B & C
3. **Gate C - VIP Entrance**: Congested, 580/600 capacity, connects to Zone A & D
4. **Gate D - East Side**: Open, 280/700 capacity, connects to Zone D & E
5. **Gate E - South Exit**: Closed, 0/500 capacity, connects to Zone E

And 5 zones:

1. **Zone A**: Connected to Gates 1 & 3
2. **Zone B**: Connected to Gates 1 & 2
3. **Zone C**: Connected to Gate 2
4. **Zone D**: Connected to Gates 3 & 4
5. **Zone E**: Connected to Gates 4 & 5

## Usage Instructions

### Opening/Closing Gates

1. Locate the gate card in the right panel
2. Click the "Open Gate" (green) or "Close Gate" (red) button
3. Observe real-time map updates and zone impact summary
4. Toast notification confirms the action

### Searching Gates

1. Use the search bar to filter by gate name or zone name
2. Results update in real-time as you type

### Filtering by Status

1. Use the status dropdown to show:
   - All gates
   - Open gates only
   - Closed gates only
   - Congested gates only

### Viewing Gate Details

1. Hover over a gate marker on the map for quick info
2. Click on a gate marker to select it (highlighted in blue)
3. View comprehensive details in the gate card

### Deleting Gates

1. Click the trash icon on a gate card
2. Confirm deletion in the modal
3. Gate is removed and affected zones are updated

## Technical Details

### State Management

- Local React state using `useState` hooks
- No external state management or backend calls
- All data persists only during component lifecycle

### Responsive Design

- Uses Tailwind CSS utility classes
- Grid layout with `lg:grid-cols-2` for split view
- Mobile-responsive with single column on small screens

### Animations

- Tailwind animate-in classes for smooth transitions
- CSS transitions for hover effects and state changes
- Toast notifications slide in from right
- Modal zooms in with backdrop blur

### Dependencies

- React (useState, useEffect)
- Lucide React icons
- Tailwind CSS (assumed to be configured)

## Future Enhancements

Potential improvements for future iterations:

1. **Backend Integration**

   - Connect to real gate hardware/sensors
   - Persist gate status to database
   - Real-time WebSocket updates

2. **Advanced Analytics**

   - Historical crowd flow data
   - Predictive congestion algorithms
   - Optimal gate distribution recommendations

3. **Automation Rules**

   - Auto-close gates when capacity reached
   - Emergency evacuation protocols
   - Time-based gate schedules

4. **Enhanced Visualizations**

   - Heat maps showing crowd density
   - Flow animations between zones
   - 3D venue representations

5. **Access Control**

   - Role-based permissions for gate operations
   - Audit logs for all gate changes
   - Multi-level approval workflows

6. **Mobile App**
   - Native mobile interface for security staff
   - Push notifications for critical events
   - QR code scanning for gate access

## Testing Recommendations

1. **Functional Testing**

   - Verify all gates can be opened/closed
   - Test zone accessibility calculation with various gate combinations
   - Validate search and filter functionality

2. **UI/UX Testing**

   - Check responsive layout on different screen sizes
   - Verify hover states and tooltips
   - Test color contrast for accessibility

3. **Edge Cases**

   - Close all gates connecting to a zone
   - Delete gates and verify zone updates
   - Test with empty search results

4. **Performance**
   - Test with larger number of gates (20+)
   - Verify smooth animations
   - Check re-render optimization

## Troubleshooting

### Gates not appearing on map

- Check gate position coordinates are valid percentages (0-100)
- Verify gates array has data

### Zone accessibility not updating

- Ensure useEffect dependency array includes `gates`
- Check gate IDs match between gates and zones

### Toast notifications not dismissing

- Verify setTimeout cleanup in useEffect
- Check toast ID generation is unique

## Component Architecture

```
GateControlPage
├── Header
│   ├── Back Button
│   ├── Title & Description
│   └── Statistics (Open/Closed Count)
│
├── Main Content (Split Layout)
│   │
│   ├── Left Section
│   │   ├── Map Header with Legend
│   │   ├── Interactive Map Canvas
│   │   │   ├── Zone Polygons
│   │   │   ├── Gate Markers
│   │   │   └── Hover Tooltips
│   │   └── Zone Impact Summary Panel
│   │
│   └── Right Section
│       ├── Search & Filter Bar
│       └── Gate Cards (Scrollable)
│           ├── Gate Header (Name & Status)
│           ├── Statistics (Zones, Crowd)
│           ├── Progress Bar
│           ├── Throughput Display
│           └── Action Buttons
│
├── Toast Notifications (Fixed Position)
│   └── Auto-dismissing Messages
│
└── Delete Confirmation Modal
    ├── Warning Message
    └── Action Buttons
```

## Summary

The Gate Control Page successfully provides organizers with:

- ✅ Real-time gate status visibility
- ✅ Quick open/close controls
- ✅ Zone accessibility tracking
- ✅ Visual map representation
- ✅ Crowd level monitoring
- ✅ Impact analysis for gate operations
- ✅ Intuitive, responsive UI
- ✅ Mock data for demonstration

This feature enhances the DrishtiX platform's live operations capabilities by giving organizers complete control over venue access points with clear visual feedback on crowd management and zone accessibility.
