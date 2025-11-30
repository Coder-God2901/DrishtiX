import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEventStore } from '@/store/useEventStore';
import { format } from 'date-fns';

export default function EventsList() {
  const { events, isLoading } = useEventStore();

  useEffect(() => {
    document.title = 'Events - EventSphere';
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground">Manage and monitor all your events</p>
        </div>
        <Link to="/events/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p>Loading events...</p>
        ) : events.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground">
            No events found. Create your first event to get started.
          </p>
        ) : (
          events.map((event) => (
            <Link key={event.id} to={`/events/${event.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{event.name}</CardTitle>
                  <CardDescription>{event.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Date:</span> {format(new Date(event.startDate), 'PPP')}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Attendees:</span> {event.expectedAttendees?.toLocaleString()}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Status:</span> <span className="capitalize">{event.status}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
