import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  Home, 
  BarChart3, 
  Settings, 
  Users, 
  Shield,
  Brain,
  Radio,
  DoorOpen,
  Zap,
  TrendingUp,
  LogOut
} from 'lucide-react';
import { useState } from 'react';

/**
 * Organizer Layout Component
 * Provides consistent navigation and layout for organizer pages
 */
export default function OrganizerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Main navigation (available always)
  const mainNavigation = [
    { name: 'Home', path: '/organizer/home', icon: Home },
  ];

  // Event-specific navigation (only when an event is selected)
  const eventNavigation = eventId ? [
    { name: 'Dashboard', path: `/organizer/event/${eventId}/dashboard`, icon: BarChart3 },
    { name: 'Command Center', path: `/organizer/event/${eventId}/command-center`, icon: Shield },
    { name: 'Operations', path: `/organizer/event/${eventId}/operations`, icon: Users },
    { name: 'Analytics', path: `/organizer/event/${eventId}/analytics`, icon: TrendingUp },
    { name: 'AI Command', path: `/organizer/event/${eventId}/ai-command`, icon: Brain },
    { name: 'Crowd Intelligence', path: `/organizer/event/${eventId}/crowd-intelligence`, icon: Radio },
    { name: 'Dispatch Center', path: `/organizer/event/${eventId}/dispatch`, icon: Radio },
    { name: 'Gate Control', path: `/organizer/event/${eventId}/gate-control`, icon: DoorOpen },
    { name: 'Automation', path: `/organizer/event/${eventId}/automation`, icon: Zap },
    { name: 'Post-Event Analysis', path: `/organizer/event/${eventId}/post-event`, icon: TrendingUp },
  ] : [];

  const handleLogout = () => {
    // Add logout logic here
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {isSidebarOpen && (
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              DrishtiX Pro
            </span>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
          >
            {isSidebarOpen ? '←' : '→'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-2">
            {mainNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isSidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                </button>
              );
            })}
          </div>

          {/* Event Navigation */}
          {eventNavigation.length > 0 && (
            <div className="space-y-2">
              {isSidebarOpen && (
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                  Event Management
                </div>
              )}
              {eventNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isSidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
