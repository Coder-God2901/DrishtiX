import { 
  Music, 
  Users, 
  Calendar, 
  PartyPopper, 
  Briefcase, 
  GraduationCap
} from "lucide-react";

export const eventTypes = [
  { id: "concert", name: "Concert", icon: Music, subtitle: "Live music events with high crowd density" },
  { id: "marathon", name: "Marathon", icon: Users, subtitle: "Running events with distributed attendees" },
  { id: "festival", name: "Festival", icon: PartyPopper, subtitle: "Multi-day outdoor celebrations" },
  { id: "rally", name: "Rally", icon: Calendar, subtitle: "Political or awareness gatherings" },
  { id: "workshop", name: "Workshop", icon: GraduationCap, subtitle: "Educational and training sessions" },
  { id: "conference", name: "Conference", icon: Briefcase, subtitle: "Professional business events" },
];

export const metaFormFields: Record<string, any[]> = {
  concert: [
    { name: "eventName", label: "Event Name", type: "text", required: true },
    { name: "artist", label: "Artist/Performer", type: "text", required: true },
    { name: "venue", label: "Venue Location", type: "text", required: true },
    { name: "expectedAttendees", label: "Expected Attendees", type: "number", required: true, help: "Helps estimate crowd density" },
    { name: "startDateTime", label: "Start Date & Time", type: "datetime-local", required: true },
    { name: "duration", label: "Duration (hours)", type: "number", required: true },
    { name: "ticketTypes", label: "Ticket Types", type: "list", help: "VIP, General, Standing, etc." },
    { name: "hasAlcohol", label: "Alcohol Served", type: "boolean" },
  ],
  marathon: [
    { name: "eventName", label: "Event Name", type: "text", required: true },
    { name: "route", label: "Route Description", type: "textarea", required: true },
    { name: "expectedParticipants", label: "Expected Participants", type: "number", required: true },
    { name: "startDateTime", label: "Start Date & Time", type: "datetime-local", required: true },
    { name: "distance", label: "Distance (km)", type: "number", required: true },
    { name: "aidStations", label: "Aid Station Locations", type: "list" },
    { name: "medicalTeams", label: "Medical Teams Count", type: "number" },
  ],
  festival: [
    { name: "eventName", label: "Festival Name", type: "text", required: true },
    { name: "venue", label: "Venue Location", type: "text", required: true },
    { name: "expectedAttendees", label: "Expected Daily Attendees", type: "number", required: true },
    { name: "startDate", label: "Start Date", type: "date", required: true },
    { name: "endDate", label: "End Date", type: "date", required: true },
    { name: "stages", label: "Stage Names", type: "list", help: "Main Stage, Side Stage, etc." },
    { name: "camping", label: "Camping Available", type: "boolean" },
  ],
  rally: [
    { name: "eventName", label: "Rally Name", type: "text", required: true },
    { name: "location", label: "Rally Location", type: "text", required: true },
    { name: "expectedAttendees", label: "Expected Attendees", type: "number", required: true },
    { name: "startDateTime", label: "Start Date & Time", type: "datetime-local", required: true },
    { name: "duration", label: "Duration (hours)", type: "number", required: true },
    { name: "speakers", label: "Speakers", type: "list" },
    { name: "securityLevel", label: "Security Level", type: "select", options: ["Low", "Medium", "High", "Critical"] },
  ],
  workshop: [
    { name: "eventName", label: "Workshop Name", type: "text", required: true },
    { name: "venue", label: "Venue", type: "text", required: true },
    { name: "expectedAttendees", label: "Expected Attendees", type: "number", required: true },
    { name: "startDateTime", label: "Start Date & Time", type: "datetime-local", required: true },
    { name: "duration", label: "Duration (hours)", type: "number", required: true },
    { name: "facilitators", label: "Facilitators", type: "list" },
  ],
  conference: [
    { name: "eventName", label: "Conference Name", type: "text", required: true },
    { name: "venue", label: "Venue", type: "text", required: true },
    { name: "expectedAttendees", label: "Expected Attendees", type: "number", required: true },
    { name: "startDate", label: "Start Date", type: "date", required: true },
    { name: "endDate", label: "End Date", type: "date", required: true },
    { name: "tracks", label: "Conference Tracks", type: "list" },
    { name: "sponsors", label: "Sponsors", type: "list" },
  ],
};