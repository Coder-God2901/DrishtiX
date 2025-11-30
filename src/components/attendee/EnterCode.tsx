/**
 * Enter Event Code Component
 * Allows attendees to join events using a 6-digit code
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';
import { attendeeService } from '@/services/attendee.service';

export default function EnterCode() {
  const [eventCode, setEventCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [searchedEvent, setSearchedEvent] = useState<any>(null);
  const navigate = useNavigate();

  const formatEventCode = (value: string) => {
    // Remove non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    // Limit to 6 characters
    return cleaned.slice(0, 6);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatEventCode(e.target.value);
    setEventCode(formatted);
  };

  const searchEvent = async () => {
    if (eventCode.length !== 6) {
      toast.error('Event code must be 6 characters');
      return;
    }

    try {
      // Search for event by code (add API endpoint in attendeeService)
      const response = await fetch(`/api/events/search?code=${eventCode}`);
      const data = await response.json();

      if (data.success && data.data) {
        setSearchedEvent(data.data);
        toast.success('Event found!');
      } else {
        toast.error('Event not found with this code');
        setSearchedEvent(null);
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Failed to search for event');
    }
  };

  const joinEvent = async () => {
    if (!searchedEvent) return;

    setIsJoining(true);
    try {
      const response = await attendeeService.joinEvent(searchedEvent.id, {
        joinMethod: 'EVENT_CODE',
        eventCode,
      }) as { success: boolean; error?: string };

      if (response.success) {
        toast.success('Successfully joined event!');
        navigate(`/attendee/events/${searchedEvent.id}/dashboard`);
      } else {
        toast.error(response.error || 'Failed to join event');
      }
    } catch (err: any) {
      console.error('Join event error:', err);
      toast.error(err.message || 'Failed to join event');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-lg">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <KeyRound className="h-8 w-8 text-purple-600" />
              <div>
                <CardTitle className="text-2xl">Enter Event Code</CardTitle>
                <CardDescription>Type the 6-character code provided by the organizer</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Code Input */}
            <div className="space-y-2">
              <Label htmlFor="eventCode">Event Code</Label>
              <Input
                id="eventCode"
                type="text"
                value={eventCode}
                onChange={handleCodeChange}
                placeholder="ABC123"
                className="text-2xl font-mono text-center tracking-widest uppercase"
                maxLength={6}
                autoFocus
              />
              <p className="text-xs text-gray-500 text-center">{eventCode.length}/6 characters</p>
            </div>

            {/* Search Button */}
            {!searchedEvent && (
              <Button onClick={searchEvent} size="lg" className="w-full" disabled={eventCode.length !== 6}>
                Search Event
              </Button>
            )}

            {/* Event Details (after search) */}
            {searchedEvent && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">Event Found</p>
                      <p className="text-lg font-bold text-green-900 dark:text-green-100 mt-1">{searchedEvent.name}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Venue</span>
                    <span className="text-sm font-medium">{searchedEvent.venue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Start Date</span>
                    <span className="text-sm font-medium">
                      {new Date(searchedEvent.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                    <span className="text-sm font-medium capitalize">{searchedEvent.status.toLowerCase()}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchedEvent(null);
                      setEventCode('');
                    }}
                    className="flex-1"
                  >
                    Search Again
                  </Button>
                  <Button onClick={joinEvent} disabled={isJoining} className="flex-1">
                    {isJoining ? 'Joining...' : 'Join Event'}
                  </Button>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium">How to use:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Get the 6-character event code from the organizer</li>
                <li>Enter the code in the field above</li>
                <li>Click "Search Event" to find the event</li>
                <li>Review event details and click "Join Event"</li>
              </ol>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-950 px-2 text-gray-500">Or</span>
              </div>
            </div>

            {/* Alternative Join Methods */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => navigate('/attendee/join/qr')} className="w-full">
                Scan QR Code
              </Button>
              <Button variant="outline" onClick={() => navigate('/attendee/join/browse')} className="w-full">
                Browse Events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
