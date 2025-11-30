# EventSphere Attendee/User Workflow Flowchart

```mermaid
flowchart TD
    Start([Start]) --> Landing[Landing Page]
    Landing --> JoinEvent[Join Event Button]
    JoinEvent --> SelectRole{Select User Type}
    SelectRole -->|Attendee| UserAuth{Login or Sign Up?}

    UserAuth -->|New User| SignUp[Sign Up Form]
    UserAuth -->|Existing User| Login[Login Form]

    SignUp --> ProfileSetup[Basic Profile Setup]
    ProfileSetup --> ProfileFields[• Name<br>• Email<br>• Phone<br>• Profile Picture<br>• Emergency Contact]
    ProfileFields --> AttendeeHome
    Login --> AttendeeHome[Attendee Home Screen]

    AttendeeHome --> JoinMethods{How to Join Event?}

    JoinMethods --> ScanQR[Scan Event QR Code]
    JoinMethods --> EnterCode[Enter Event Code/Link]
    JoinMethods --> BrowseEvents[Browse Events]

    ScanQR --> Camera[Open Camera]
    Camera --> ScanSuccess{QR Scanned?}
    ScanSuccess -->|Yes| EventInfo
    ScanSuccess -->|No| ScanRetry[Retry Scan]
    ScanRetry --> Camera

    EnterCode --> CodeInput[Enter 6-Digit Code]
    CodeInput --> ValidateCode{Code Valid?}
    ValidateCode -->|Yes| EventInfo
    ValidateCode -->|No| InvalidCode[Show Error - Retry]
    InvalidCode --> CodeInput

    BrowseEvents --> EventsList[Events List]
    EventsList --> FilterEvents[Filter Options:<br>• Nearby Events<br>• Featured Events<br>• By Category<br>• By Date<br>• Search]
    FilterEvents --> SelectEvent[Select Event]
    SelectEvent --> EventInfo[Event Info Screen]

    EventInfo --> EventDetails[Event Details:<br>• Name & Description<br>• Date & Time<br>• Venue Location<br>• Event Type<br>• Organizer Info<br>• Safety Rating<br>• Crowd Status]

    EventDetails --> RegisterCheck{Already Registered?}

    RegisterCheck -->|No| Register[Register/Check-In]
    RegisterCheck -->|Yes| PermissionsCheck

    Register --> TicketCheck{Ticket Required?}
    TicketCheck -->|Yes| ShowTicket[Show Ticket/Pass]
    TicketCheck -->|No| FreeEntry[Free Entry - Confirm]

    ShowTicket --> VerifyTicket{Ticket Valid?}
    VerifyTicket -->|Yes| CheckInSuccess
    VerifyTicket -->|No| TicketError[Invalid Ticket - Contact Support]

    FreeEntry --> CheckInSuccess[✓ Check-In Successful]
    CheckInSuccess --> PermissionsCheck

    PermissionsCheck[Request Permissions] --> LocationPerm[Location Access]
    LocationPerm --> LocationGrant{Grant Location?}
    LocationGrant -->|Yes| NotificationPerm
    LocationGrant -->|No| LimitedMode[Limited Features Mode]

    NotificationPerm[Notification Access]
    NotificationPerm --> NotifyGrant{Grant Notifications?}
    NotifyGrant -->|Yes| AttendeeDashboard
    NotifyGrant -->|No| AttendeeDashboard

    LimitedMode --> AttendeeDashboard[Attendee Event Dashboard]

    AttendeeDashboard --> DashFeatures{Dashboard Features}

    DashFeatures --> LiveMap[Live Venue Map]
    LiveMap --> MapFeatures[Map Features:<br>• Current Location Pin<br>• Crowd Heatmap Overlay<br>• Gates & Entrances<br>• Stages & Areas<br>• Facilities (Toilets, First Aid)<br>• Food & Beverage Stalls<br>• Emergency Exits<br>• Restricted Zones]

    DashFeatures --> EventSchedule[Event Schedule]
    EventSchedule --> ScheduleView[• Performance Timings<br>• Stage Lineup<br>• Break Periods<br>• Special Sessions<br>• Set Reminders]

    DashFeatures --> Navigation[Navigation to Destinations]
    Navigation --> SelectDestination{Choose Destination}
    SelectDestination --> DestOptions[• Gates/Entrances<br>• Stages<br>• Toilets<br>• Food Stalls<br>• First Aid<br>• Parking<br>• Exit Points]
    DestOptions --> NavigationFlow

    DashFeatures --> AlertsSection[Alerts & Updates]
    AlertsSection --> AlertTypes[Alert Types:<br>• Safety Warnings<br>• Route Changes<br>• Schedule Updates<br>• Weather Alerts<br>• Crowd Updates<br>• Emergency Notifications]

    DashFeatures --> SOSButton[🆘 SOS Help Button]
    SOSButton --> SOSFlow

    DashFeatures --> SettingsPrivacy[Settings & Privacy]
    SettingsPrivacy --> SettingsMenu[• Profile Settings<br>• Privacy Controls<br>• Location Sharing Toggle<br>• Notification Preferences<br>• Emergency Contacts<br>• Logout]

    NavigationFlow[Navigation Flow] --> ShowCurrentLoc[Display Current Location]
    ShowCurrentLoc --> CalculateRoute[Calculate Optimal Route]
    CalculateRoute --> RouteConsiderations[Route Calculation:<br>• Shortest Distance<br>• Avoid Crowded Areas<br>• Real-time Heatmap Data<br>• Accessible Paths<br>• Safety Priority]

    RouteConsiderations --> DisplayRoute[Display Recommended Route]
    DisplayRoute --> RouteVisualization[• Blue Guidance Line<br>• Turn-by-Turn Directions<br>• ETA Display<br>• Distance Remaining<br>• Crowd Levels on Path]

    RouteVisualization --> FollowRoute[User Follows Route]
    FollowRoute --> RouteProgress{Reached Destination?}

    RouteProgress -->|No| CheckDeviation{Off Route?}
    CheckDeviation -->|Yes| Recalculate[Recalculate Route]
    Recalculate --> DisplayRoute
    CheckDeviation -->|No| UpdateProgress[Update Progress]
    UpdateProgress --> FollowRoute

    RouteProgress -->|Yes| ArrivalConfirm[✓ Destination Reached]
    ArrivalConfirm --> AttendeeDashboard

    AlertTypes --> AlertReceived{Alert Received?}
    AlertReceived -->|Yes| AlertNotification[Push Notification + In-App Alert]
    AlertNotification --> AlertDetails[Open Alert Details]
    AlertDetails --> AlertContent[Alert Content:<br>• Alert Type<br>• Severity Level<br>• Affected Area<br>• Description<br>• Safety Instructions<br>• Recommended Actions]

    AlertContent --> RouteChangeCheck{Route Change Suggested?}

    RouteChangeCheck -->|Yes| AcceptRoute{Accept New Route?}
    AcceptRoute -->|Yes| ApplyRouteChange[Apply Route Change]
    AcceptRoute -->|No| DismissAlert[Dismiss Alert]

    ApplyRouteChange --> NewRoute[Display New Safe Route]
    NewRoute --> RouteVisualization

    RouteChangeCheck -->|No| FollowInstructions[Follow Safety Instructions]
    FollowInstructions --> MarkRead[Mark Alert as Read]
    MarkRead --> AttendeeDashboard

    DismissAlert --> AttendeeDashboard

    AlertReceived -->|No| ContinueUse[Continue Using App]
    ContinueUse --> AttendeeDashboard

    SOSFlow[SOS Emergency Flow] --> SOSConfirm{Confirm SOS?}
    SOSConfirm -->|Yes| SOSActivated[🚨 SOS ACTIVATED]
    SOSConfirm -->|No| CancelSOS[Cancel]
    CancelSOS --> AttendeeDashboard

    SOSActivated --> IssueSelection{Describe Issue}
    IssueSelection --> IssueTypes[Issue Types:<br>• Medical Emergency<br>• Safety Threat<br>• Lost Person<br>• Fire/Hazard<br>• Crowd Crush<br>• Other Emergency]

    IssueTypes --> IssueDetails[Provide Details]
    IssueDetails --> DetailsInput[• Issue Description<br>• Add Photos/Video<br>• Voice Note<br>• Number of People Affected]

    DetailsInput --> AutoLocation[Auto-Share Precise Location]
    AutoLocation --> SendToControl[📡 Send to Control Room]

    SendToControl --> ControlNotified[Control Room Notified]
    ControlNotified --> SOSConfirmation[✓ SOS Received Confirmation]
    SOSConfirmation --> ShowSOSStatus[Show SOS Status:<br>• Acknowledged<br>• Help Dispatched<br>• ETA: X minutes<br>• Responder Contact]

    ShowSOSStatus --> AwaitHelp[Await Emergency Response]
    AwaitHelp --> HelpArrived{Help Arrived?}

    HelpArrived -->|Yes| MarkResolved[Mark SOS as Resolved]
    HelpArrived -->|No| UpdateStatus[Auto Status Updates]
    UpdateStatus --> AwaitHelp

    MarkResolved --> ThankYou[Thank You Message]
    ThankYou --> AttendeeDashboard

    AttendeeDashboard --> EventEnded{Event Ended?}

    EventEnded -->|No| ContinueDash[Continue Event Experience]
    ContinueDash --> AttendeeDashboard

    EventEnded -->|Yes| PostEventFlow[Post-Event Flow]

    PostEventFlow --> CheckOut[Auto Check-Out]
    CheckOut --> FeedbackPrompt[Feedback Request]

    FeedbackPrompt --> ProvideRating{Provide Feedback?}

    ProvideRating -->|Yes| FeedbackForm[Feedback Form]
    FeedbackForm --> FeedbackQuestions[Feedback Questions:<br>• Overall Experience (1-5 stars)<br>• Safety Rating (1-5 stars)<br>• Navigation Helpfulness<br>• Crowd Management<br>• Alert Usefulness<br>• Venue Facilities<br>• Would Recommend?<br>• Comments/Suggestions]

    FeedbackQuestions --> SubmitFeedback[Submit Feedback]
    SubmitFeedback --> ThankYouFeedback[✓ Thank You for Feedback]

    ProvideRating -->|No| SkipFeedback[Skip Feedback]

    ThankYouFeedback --> ReturnHome[Return to Home]
    SkipFeedback --> ReturnHome

    ReturnHome --> AttendeeHome

    style Start fill:#4CAF50
    style SOSActivated fill:#F44336
    style CheckInSuccess fill:#4CAF50
    style ArrivalConfirm fill:#2196F3
    style AttendeeDashboard fill:#9C27B0
    style AlertNotification fill:#FF9800
```

## Role-Based Access Control (RBAC)

### Attendee Permissions

**Full Access:**

- ✅ Join Events (QR/Code/Browse)
- ✅ View Event Information
- ✅ Access Live Venue Map
- ✅ Real-time Navigation
- ✅ Receive Safety Alerts
- ✅ Trigger SOS Emergency
- ✅ View Event Schedule
- ✅ Submit Feedback
- ✅ Profile Management

**Restricted Access:**

- ❌ Cannot create/edit events
- ❌ Cannot dispatch teams
- ❌ Cannot broadcast messages
- ❌ Cannot access organizer dashboard
- ❌ Limited to events they're registered for
- ❌ Cannot view other attendees' data
- ❌ Cannot modify venue layouts

**Privacy Controls:**

- 🔒 Location sharing (can be disabled)
- 🔒 Notification preferences
- 🔒 Profile visibility settings
- 🔒 Emergency contact privacy

---

## Attendee Dashboard Features

### 1. Live Venue Map

```
Interactive Features:
- Pan and zoom controls
- Current location indicator (blue dot)
- Crowd density heatmap overlay
- Searchable points of interest
- Distance measurements
- Offline map caching

Points of Interest:
- 🚪 Gates & Entrances
- 🎤 Stages & Performance Areas
- 🚻 Restrooms
- 🍔 Food & Beverage Stalls
- ⚕️ First Aid Stations
- 🚑 Medical Tents
- 🅿️ Parking Areas
- 🚪 Emergency Exits
- 🚫 Restricted Zones
- ℹ️ Information Booths
```

### 2. Event Schedule

```
Features:
- Timeline view
- Stage-wise filtering
- Artist/performer details
- Set reminders (push notifications)
- Add to calendar
- Share with friends
- Live updates (if schedule changes)

Display:
- Current session highlight
- Next up indicator
- Time remaining countdown
```

### 3. Navigation System

```
Route Calculation Factors:
- Current crowd density
- Fastest path
- Safest path
- Accessible routes
- Real-time congestion
- Closed areas/routes

Navigation Display:
- Turn-by-turn directions
- Voice guidance (optional)
- ETA calculation
- Distance remaining
- Crowd level on route (color-coded)
- Alternative routes
```

### 4. Alerts & Notifications

```
Alert Categories:
🚨 Emergency Alerts (Critical)
  - Evacuation orders
  - Immediate danger warnings
  - Medical emergencies nearby

⚠️ Safety Warnings (High)
  - Crowd surge detected
  - Route closures
  - Weather hazards

ℹ️ General Updates (Medium)
  - Schedule changes
  - Facility closures
  - Traffic updates

📢 Announcements (Low)
  - Lost & found
  - Special offers
  - Event highlights

Alert Actions:
- View details
- Accept route change
- Share with nearby friends
- Mark as read
- Report issue
```

### 5. SOS Emergency System

```
SOS Trigger:
1. Long-press SOS button (3 seconds)
2. Confirm emergency
3. Select issue type
4. Add details/media
5. Auto-send location
6. Notify control room

Response Tracking:
- Acknowledgment status
- Responder details
- ETA display
- Live tracking of help
- Direct communication channel
- Safety tips while waiting

Post-Resolution:
- Incident report
- Follow-up care info
- Feedback on response
```

---

## Event Joining Methods

### Method 1: QR Code Scan

```
Steps:
1. Click "Scan QR Code"
2. Grant camera permission
3. Point at event QR code (poster/screen)
4. Auto-detect and decode
5. Redirect to event info
6. Register/Check-in

QR Code Contains:
- Event ID
- Event name
- Date & time
- Venue location
- Direct registration link
```

### Method 2: Event Code Entry

```
Steps:
1. Click "Enter Code"
2. Type 6-digit alphanumeric code
3. Validate code
4. Redirect to event info
5. Register/Check-in

Code Format:
- Example: AB12CD
- Case-insensitive
- Valid for event duration + 1 day
```

### Method 3: Browse Events

```
Filters:
📍 Nearby Events (GPS-based)
  - Within 50km
  - Sort by distance

⭐ Featured Events
  - Promoted events
  - Popular events
  - High-rated events

📅 By Date
  - Today
  - This week
  - This month
  - Custom date range

🏷️ By Category
  - Sports
  - Concerts
  - Festivals
  - Corporate
  - Rallies
  - Other

🔍 Search
  - Event name
  - Venue
  - Organizer
  - Location
```

---

## Navigation Feature Details

### Real-time Route Updates

```
Dynamic Recalculation:
- Every 30 seconds
- When crowd density changes
- When routes are blocked
- When user deviates from path
- When alerts affect route

Route Preferences (User Settings):
- Fastest route
- Least crowded route
- Accessible route (wheelchair)
- Scenic route
- Avoid stairs/escalators
```

### Crowd Avoidance

```
Heatmap Integration:
- Green zones: < 30% capacity (safe)
- Yellow zones: 30-60% capacity (moderate)
- Orange zones: 60-80% capacity (crowded)
- Red zones: > 80% capacity (avoid)

Smart Routing:
- Automatically avoid red zones
- Suggest detours around yellow/orange
- Predict future congestion
- Balance user distribution
```

### Arrival Notifications

```
When Near Destination:
- 50m: "Almost there" notification
- 10m: "Arriving at destination"
- 0m: "You've arrived!" + suggestions
  - Nearby facilities
  - Wait times
  - Crowd levels
  - Next recommended activity
```

---

## Privacy & Security

### Data Collection (User Control)

```
Essential Data (Cannot Disable):
- Account information
- Event registration
- Safety alerts

Optional Data (Can Disable):
- Real-time location tracking
- Movement patterns
- Heatmap contributions
- Analytics data

User Rights:
- View collected data
- Download personal data
- Delete account
- Opt-out of analytics
```

### Location Sharing

```
Sharing Options:
1. Always share (full navigation)
2. Share only during event
3. Share only for safety (SOS)
4. Never share (limited features)

Privacy Modes:
- Incognito mode (no tracking)
- Friends-only visibility
- Emergency contacts only
- Fully public (leaderboards/social)
```

---

## Post-Event Feedback

### Feedback Categories

```
1. Overall Experience
   - 1-5 star rating
   - Comments

2. Safety & Security
   - Felt safe? (Yes/No/Somewhat)
   - Security presence adequate?
   - Emergency response rating

3. Navigation & App
   - Map accuracy
   - Route helpfulness
   - Alert usefulness
   - App performance

4. Venue Facilities
   - Restroom cleanliness
   - Food quality/variety
   - Accessibility
   - Signage clarity

5. Event Management
   - Organization rating
   - Schedule adherence
   - Communication quality

6. Recommendations
   - Would attend again?
   - Would recommend to others?
   - Suggestions for improvement
```

### Incentives for Feedback

```
Rewards:
- Discount codes for future events
- Early access to tickets
- Loyalty points
- Prize draw entries
- Thank you badges
```

---

## Accessibility Features

### For Users with Disabilities

```
Visual Assistance:
- Screen reader support
- High contrast mode
- Large text options
- Voice navigation
- Audio alerts

Mobility Assistance:
- Wheelchair-accessible routes
- Elevator locations
- Accessible restroom markers
- Reserved seating info
- Assistance request button

Hearing Assistance:
- Visual alert indicators
- Text-based notifications
- Vibration alerts
- Closed captions for announcements
```

---

## Offline Functionality

### Available Without Internet

```
Cached Features:
- Downloaded venue map
- Event schedule
- Saved routes
- Emergency contact info
- SOS trigger (queues for sending)

Sync When Online:
- Location updates
- Alert delivery
- Navigation updates
- Feedback submission
```

---

## Social Features (Optional)

### Friend Integration

```
Features:
- Find friends at event
- Share location with friends
- Group navigation
- Split up alerts
- Meetup point suggestions
- Friend safety status
```

### Community Features

```
Features:
- Live event feed
- Photo sharing
- Tips & recommendations
- Lost & found posts
- Ride sharing coordination
```
