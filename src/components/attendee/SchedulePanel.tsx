/**
 * Schedule Panel Component
 * Displays event schedule with reminders and live tracking
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, Clock, MapPin, Bell, BellOff, Star, Users, Navigation } from 'lucide-react';

interface ScheduleItem {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  type: string;
  capacity?: number;
  registered?: number;
  featured?: boolean;
}

interface SchedulePanelProps {
  eventId: string;
}

// Mock schedule data
const mockSchedule: ScheduleItem[] = [
  {
    id: '1',
    title: 'Opening Ceremony',
    description: 'Grand opening with keynote speakers',
    startTime: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    location: 'Main Stage',
    type: 'Ceremony',
    capacity: 5000,
    registered: 4200,
    featured: true,
  },
  {
    id: '2',
    title: 'Keynote Address',
    description: 'Industry leaders share insights',
    startTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString(),
    location: 'Conference Hall A',
    type: 'Talk',
    capacity: 1000,
    registered: 950,
    featured: true,
  },
  {
    id: '3',
    title: 'Lunch Break',
    description: 'Networking opportunity with refreshments',
    startTime: new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    location: 'Food Court',
    type: 'Break',
  },
  {
    id: '4',
    title: 'Technical Workshop',
    description: 'Hands-on session on latest technologies',
    startTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
    location: 'Workshop Room 1',
    type: 'Workshop',
    capacity: 200,
    registered: 185,
  },
  {
    id: '5',
    title: 'Closing Ceremony',
    description: 'Event wrap-up and announcements',
    startTime: new Date(Date.now() + 11 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    location: 'Main Stage',
    type: 'Ceremony',
    capacity: 5000,
    registered: 3800,
    featured: true,
  },
];

export default function SchedulePanel({ eventId }: SchedulePanelProps) {
  const [reminders, setReminders] = useState<string[]>([]);

  const toggleReminder = (itemId: string) => {
    if (reminders.includes(itemId)) {
      setReminders(reminders.filter((id) => id !== itemId));
      toast.success('Reminder removed');
    } else {
      setReminders([...reminders, itemId]);
      toast.success('Reminder set - you will be notified 15 minutes before');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Ceremony':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Talk':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Workshop':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Break':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const isItemUpcoming = (startTime: string) => {
    return new Date(startTime) > new Date();
  };

  const isItemNow = (startTime: string, endTime: string) => {
    const now = new Date();
    return new Date(startTime) <= now && new Date(endTime) >= now;
  };

  const getOccupancyPercentage = (registered?: number, capacity?: number) => {
    if (!registered || !capacity) return 0;
    return Math.round((registered / capacity) * 100);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event Schedule
          </CardTitle>
          <CardDescription>Plan your day and set reminders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockSchedule.map((item) => (
              <Card
                key={item.id}
                className={`${isItemNow(item.startTime, item.endTime) ? 'border-green-600 border-2' : ''}`}
              >
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {new Date(item.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            -{' '}
                            {new Date(item.endTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{item.title}</h3>
                          {item.featured && <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />}
                          {isItemNow(item.startTime, item.endTime) && <Badge className="bg-green-600">LIVE NOW</Badge>}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.description}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="h-3 w-3" />
                          <span>{item.location}</span>
                        </div>
                        {item.capacity && item.registered && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>
                                  {item.registered} / {item.capacity} registered
                                </span>
                              </div>
                              <span>{getOccupancyPercentage(item.registered, item.capacity)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  getOccupancyPercentage(item.registered, item.capacity) >= 90
                                    ? 'bg-red-600'
                                    : getOccupancyPercentage(item.registered, item.capacity) >= 70
                                      ? 'bg-yellow-600'
                                      : 'bg-green-600'
                                }`}
                                style={{
                                  width: `${getOccupancyPercentage(item.registered, item.capacity)}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <Badge className={getTypeColor(item.type)}>{item.type}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => toggleReminder(item.id)}
                        disabled={!isItemUpcoming(item.startTime)}
                      >
                        {reminders.includes(item.id) ? (
                          <>
                            <BellOff className="h-4 w-4 mr-2" />
                            Remove Reminder
                          </>
                        ) : (
                          <>
                            <Bell className="h-4 w-4 mr-2" />
                            Set Reminder
                          </>
                        )}
                      </Button>
                      {isItemNow(item.startTime, item.endTime) && (
                        <Button size="sm" className="flex-1">
                          <Navigation className="h-4 w-4 mr-2" />
                          Navigate
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <Calendar className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold">{mockSchedule.length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <Bell className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold">{reminders.length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Active Reminders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <Star className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
              <p className="text-2xl font-bold">{mockSchedule.filter((item) => item.featured).length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Featured Events</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
