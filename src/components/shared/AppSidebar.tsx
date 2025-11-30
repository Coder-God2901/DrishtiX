import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  AlertTriangle,
  Map,
  Box,
  Clock,
  Route,
  BarChart3,
  FileText,
  Settings,
  User,
  Video,
  Brain,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const navigation = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { title: 'Analytics', icon: BarChart3, href: '/analytics' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { title: 'Events', icon: Calendar, href: '/events' },
      { title: 'Alerts', icon: AlertTriangle, href: '/alerts' },
      { title: 'Team', icon: Users, href: '/team' },
      { title: 'Venue Map', icon: Map, href: '/venue' },
    ],
  },
  {
    title: 'Advanced Features',
    items: [
      { title: 'Digital Twin', icon: Box, href: '/digital-twin' },
      { title: 'Scheduling', icon: Clock, href: '/scheduling' },
      { title: 'Routing', icon: Route, href: '/routing' },
      { title: 'Video Surveillance', icon: Video, href: '/video-surveillance' },
      { title: 'ML Training', icon: Brain, href: '/ml-training' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { title: 'Reports', icon: FileText, href: '/reports' },
      { title: 'Settings', icon: Settings, href: '/settings' },
      { title: 'Profile', icon: User, href: '/profile' },
    ],
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <div className="px-6 py-4">
          <h2 className="text-2xl font-bold">EventSphere</h2>
        </div>

        {navigation.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.href}
                        className={({ isActive }) => (isActive ? 'bg-accent text-accent-foreground' : '')}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
