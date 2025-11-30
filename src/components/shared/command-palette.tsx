import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '../ui/command';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useUIStore } from '../../store/useUIStore';
import {
  Calendar,
  Map,
  Users,
  LayoutDashboard,
  Zap,
  AlertCircle,
  Navigation,
  Activity,
  Settings,
  Search,
  Bell,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: any;
  action: () => void;
  keywords: string[];
  category: string;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [search, setSearch] = useState('');

  useKeyboardShortcut({
    key: 'k',
    meta: true,
    callback: () => setCommandPaletteOpen(!commandPaletteOpen),
  });

  useKeyboardShortcut({
    key: 'k',
    ctrl: true,
    callback: () => setCommandPaletteOpen(!commandPaletteOpen),
  });

  useEffect(() => {
    if (!commandPaletteOpen) {
      setSearch('');
    }
  }, [commandPaletteOpen]);

  const commands: CommandItem[] = useMemo(
    () => [
      // Navigation
      {
        id: 'nav-dashboard',
        title: 'Go to Dashboard',
        icon: LayoutDashboard,
        action: () => {
          navigate('/dashboard');
          setCommandPaletteOpen(false);
        },
        keywords: ['dashboard', 'home', 'overview'],
        category: 'Navigation',
      },
      {
        id: 'nav-events',
        title: 'Go to Events',
        icon: Calendar,
        action: () => {
          navigate('/events');
          setCommandPaletteOpen(false);
        },
        keywords: ['events', 'calendar', 'schedule'],
        category: 'Navigation',
      },
      {
        id: 'nav-venue',
        title: 'Go to Venue Mapping',
        icon: Map,
        action: () => {
          navigate('/venue');
          setCommandPaletteOpen(false);
        },
        keywords: ['venue', 'map', 'location', 'geofence'],
        category: 'Navigation',
      },
      {
        id: 'nav-team',
        title: 'Go to Team Management',
        icon: Users,
        action: () => {
          navigate('/team');
          setCommandPaletteOpen(false);
        },
        keywords: ['team', 'staff', 'personnel', 'roles'],
        category: 'Navigation',
      },
      {
        id: 'nav-alerts',
        title: 'Go to Alerts',
        icon: AlertCircle,
        action: () => {
          navigate('/alerts');
          setCommandPaletteOpen(false);
        },
        keywords: ['alerts', 'incidents', 'emergency', 'notifications'],
        category: 'Navigation',
      },
      {
        id: 'nav-routing',
        title: 'Go to Attendee Routing',
        icon: Navigation,
        action: () => {
          navigate('/routing');
          setCommandPaletteOpen(false);
        },
        keywords: ['routing', 'navigation', 'directions', 'attendee'],
        category: 'Navigation',
      },
      {
        id: 'nav-simulation',
        title: 'Go to Digital Twin',
        icon: Activity,
        action: () => {
          navigate('/simulation');
          setCommandPaletteOpen(false);
        },
        keywords: ['simulation', 'digital twin', 'modeling', 'prediction'],
        category: 'Navigation',
      },
      {
        id: 'nav-predictive',
        title: 'Go to AI Scheduling',
        icon: Zap,
        action: () => {
          navigate('/predictive');
          setCommandPaletteOpen(false);
        },
        keywords: ['ai', 'scheduling', 'predictive', 'optimization'],
        category: 'Navigation',
      },

      // Actions
      {
        id: 'action-create-event',
        title: 'Create New Event',
        description: 'Start creating a new event',
        icon: Calendar,
        action: () => {
          navigate('/events/create');
          setCommandPaletteOpen(false);
        },
        keywords: ['create', 'new', 'event', 'add'],
        category: 'Actions',
      },
      {
        id: 'action-search',
        title: 'Search Everything',
        description: 'Search across all data',
        icon: Search,
        action: () => {
          // Open advanced search modal
          setCommandPaletteOpen(false);
        },
        keywords: ['search', 'find', 'look'],
        category: 'Actions',
      },
      {
        id: 'action-notifications',
        title: 'View Notifications',
        description: 'See all notifications',
        icon: Bell,
        action: () => {
          navigate('/notifications');
          setCommandPaletteOpen(false);
        },
        keywords: ['notifications', 'alerts', 'updates'],
        category: 'Actions',
      },

      // Settings
      {
        id: 'settings-general',
        title: 'Open Settings',
        icon: Settings,
        action: () => {
          navigate('/settings');
          setCommandPaletteOpen(false);
        },
        keywords: ['settings', 'preferences', 'configuration'],
        category: 'Settings',
      },
      {
        id: 'settings-theme-toggle',
        title: 'Toggle Theme',
        description: 'Switch between light and dark mode',
        icon: Settings,
        action: () => {
          // Toggle theme
          setCommandPaletteOpen(false);
        },
        keywords: ['theme', 'dark', 'light', 'appearance'],
        category: 'Settings',
      },
    ],
    [navigate, setCommandPaletteOpen]
  );

  const filteredCommands = useMemo(() => {
    if (!search) return commands;

    const searchLower = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(searchLower) ||
        cmd.description?.toLowerCase().includes(searchLower) ||
        cmd.keywords.some((keyword) => keyword.toLowerCase().includes(searchLower))
    );
  }, [search, commands]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Type a command or search..." value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groupedCommands).map(([category, items], index) => (
          <div key={category}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={category}>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem key={item.id} onSelect={item.action}>
                    <Icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{item.title}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
