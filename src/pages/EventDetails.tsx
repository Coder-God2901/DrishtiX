import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEventStore } from '@/store/useEventStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

export default function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { events } = useEventStore();

  const event = events.find((e) => e.id === eventId);

  useEffect(() => {
    if (event) {
      document.title = `${event.name} - EventSphere`;
    }
  }, [event]);

  if (!event) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/events')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>
        <p>Event not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/events')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Events
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{event.name}</CardTitle>
            <CardDescription>{event.location}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Event Details</h3>
              <div className="mt-2 space-y-2 text-sm">
                <p>
                  <span className="font-medium">Start:</span> {format(new Date(event.startDate), 'PPP p')}
                </p>
                <p>
                  <span className="font-medium">End:</span> {format(new Date(event.endDate), 'PPP p')}
                </p>
                <p>
                  <span className="font-medium">Expected Attendees:</span> {event.expectedAttendees?.toLocaleString()}
                </p>
                <p>
                  <span className="font-medium">Status:</span> <span className="capitalize">{event.status}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Real-time Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Real-time event statistics and monitoring will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
