import { useState } from 'react';
import { EventBrowse } from './EventBrowse';
import { EventDetail } from './EventDetail';
import { TicketPurchase } from './TicketPurchase';
import { MyTickets } from './MyTickets';

interface AttendeeEventHubProps {
  onBack: () => void;
  onSwitchEvent?: (eventId: string) => void;
}

export type EventType = {
  id: string;
  name: string;
  image: string;
  location: string;
  venue: string;
  date: string;
  time: string;
  crowdStatus: 'calm' | 'busy' | 'crowded';
  safetyScore: number;
  price: number;
  isFree: boolean;
  category: string;
  description: string;
  expectedAttendance: number;
  hostName: string;
  bestGate: string;
  queueTime: number;
  reviews: Review[];
  averageRating: number;
};

export type Review = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  safetyRating: number;
  crowdComfort: number;
  cleanliness: number;
  date: string;
};

type View = 'browse' | 'detail' | 'purchase' | 'tickets';

export function AttendeeEventHub({ onBack, onSwitchEvent }: AttendeeEventHubProps) {
  const [currentView, setCurrentView] = useState<View>('browse');
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);

  const handleEventSelect = (event: EventType) => {
    setSelectedEvent(event);
    setCurrentView('detail');
  };

  const handleRegister = (event: EventType) => {
    setSelectedEvent(event);
    setCurrentView('purchase');
  };

  const handlePurchaseComplete = () => {
    setCurrentView('tickets');
  };

  const handleBack = () => {
    if (currentView === 'detail') {
      setCurrentView('browse');
      setSelectedEvent(null);
    } else if (currentView === 'purchase') {
      setCurrentView('detail');
    } else if (currentView === 'tickets') {
      setCurrentView('browse');
      setSelectedEvent(null);
    } else {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/20">
      {currentView === 'browse' && (
        <EventBrowse 
          onBack={onBack}
          onEventSelect={handleEventSelect}
          onViewTickets={() => setCurrentView('tickets')}
        />
      )}

      {currentView === 'detail' && selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onBack={handleBack}
          onRegister={() => handleRegister(selectedEvent)}
        />
      )}

      {currentView === 'purchase' && selectedEvent && (
        <TicketPurchase
          event={selectedEvent}
          onBack={handleBack}
          onComplete={handlePurchaseComplete}
        />
      )}

      {currentView === 'tickets' && (
        <MyTickets
          onBack={handleBack}
          onEventSelect={handleEventSelect}
        />
      )}
    </div>
  );
}
