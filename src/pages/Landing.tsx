/**
 * Landing Page
 * Public landing page showcasing platform USPs and role selection
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, TrendingUp, Brain, Zap, Target, RefreshCw, Users, Calendar, ChevronRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [, setSelectedRole] = useState<'organizer' | 'attendee' | null>(null);

  const usps = [
    {
      icon: <TrendingUp className="h-8 w-8 text-blue-600" />,
      title: 'USP 1 — Prediction, not just monitoring',
      description: 'Most systems only show current congestion. We forecast it.',
      detail: 'Predict crowd density 5-30 minutes ahead using ConvLSTM neural networks',
      badge: 'Predictive AI',
    },
    {
      icon: <Shield className="h-8 w-8 text-purple-600" />,
      title: 'USP 2 — Triple-layer anomaly detection',
      description: 'Rules + Isolation Forest + Autoencoder = safer & smarter detection.',
      detail: 'Multi-model approach catches violence, fire, panic, and crowd surges',
      badge: 'Triple Security',
    },
    {
      icon: <Users className="h-8 w-8 text-green-600" />,
      title: 'USP 3 — Works even without cameras',
      description: 'We can run just on attendee density → scalable & practical.',
      detail: 'Mobile app GPS tracking, WiFi/Bluetooth sensors, and ticket scanning',
      badge: 'Camera-Free',
    },
    {
      icon: <Zap className="h-8 w-8 text-orange-600" />,
      title: 'USP 4 — Actions, not just warnings',
      description: 'System suggests routes, deploys staff, and guides crowd movement.',
      detail: 'Auto-dispatch teams, push route changes, broadcast safety messages',
      badge: 'Automated Actions',
    },
    {
      icon: <Target className="h-8 w-8 text-red-600" />,
      title: 'USP 5 — Multi-model switching based on event type',
      description:
        'Our system automatically switches between Sports Mode / Concert Mode / Rally Mode for better predictions.',
      detail: 'Just like playlists change for mood — our models change for crowd behavior',
      badge: 'Smart Switching',
    },
    {
      icon: <RefreshCw className="h-8 w-8 text-indigo-600" />,
      title: 'USP 6 — Self-learning system that improves after every event',
      description: 'With every event, the system becomes more intelligent, reducing errors over time.',
      detail: 'Just like Google Maps learns traffic patterns — our model learns movement patterns',
      badge: 'Self-Learning',
    },
  ];

  const handleGetStarted = () => {
    navigate('/auth/role-selection');
  };

  const handleRoleSelect = (role: 'organizer' | 'attendee') => {
    setSelectedRole(role);
    navigate('/auth/role-selection', { state: { preselectedRole: role } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-600 text-white">
            <Brain className="h-3 w-3 mr-1" />
            Powered by AI & ML
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            EventSphere DrishtiX
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            AI-Powered Crowd Management & Safety Platform
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">Predict. Detect. Protect. Guide. Learn.</p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg"
          >
            Get Started
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
          <Card
            className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-blue-500"
            onClick={() => handleRoleSelect('organizer')}
          >
            <CardHeader>
              <Calendar className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle className="text-2xl">I'm an Event Organizer</CardTitle>
              <CardDescription className="text-base">
                Create events, monitor crowds, manage incidents, and ensure safety
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>✓ 7-step event creation wizard</li>
                <li>✓ Live crowd heatmap & predictions</li>
                <li>✓ AI-powered anomaly detection</li>
                <li>✓ Auto-dispatch emergency teams</li>
                <li>✓ Post-event analytics & reports</li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-purple-500"
            onClick={() => handleRoleSelect('attendee')}
          >
            <CardHeader>
              <Users className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle className="text-2xl">I'm an Attendee</CardTitle>
              <CardDescription className="text-base">
                Join events, navigate venues, get alerts, and stay safe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>✓ Scan QR or enter event code</li>
                <li>✓ Live venue map with POIs</li>
                <li>✓ Crowd-aware navigation</li>
                <li>✓ Real-time safety alerts</li>
                <li>✓ One-touch SOS emergency</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* USPs Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Our 6 Unique Selling Points</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {usps.map((usp, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    {usp.icon}
                    <Badge variant="secondary" className="text-xs">
                      {usp.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{usp.title}</CardTitle>
                  <CardDescription className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {usp.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{usp.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">95%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Prediction Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">&lt;2min</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Alert Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">3-Layer</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Anomaly Detection</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">100%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Self-Learning</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to transform your event management?</h3>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg"
          >
            Get Started Now
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2025 EventSphere DrishtiX. Powered by AI & ML.</p>
        </div>
      </footer>
    </div>
  );
}
