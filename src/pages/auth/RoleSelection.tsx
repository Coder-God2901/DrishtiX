/**
 * Role Selection Page
 * User selects their role (Organizer or Attendee) before authentication
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function RoleSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRole, setSelectedRole] = useState<'ORGANIZER' | 'ATTENDEE' | null>(
    location.state?.preselectedRole?.toUpperCase() || null
  );

  useEffect(() => {
    document.title = 'Select Your Role - EventSphere';
  }, []);

  const handleContinue = () => {
    if (!selectedRole) return;

    // Navigate to register with role pre-selected
    navigate('/auth/register', { state: { role: selectedRole } });
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg-light to-surface-muted dark:from-dark-bg dark:to-dark-surface p-4">
      <div className="w-full max-w-4xl">
        <Button variant="ghost" onClick={handleBack} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Select Your Role</CardTitle>
            <CardDescription className="text-lg">Choose how you'll be using EventSphere DrishtiX</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Organizer Card */}
          <Card
            className={`cursor-pointer transition-all hover:shadow-xl ${
              selectedRole === 'ORGANIZER' ? 'border-4 border-blue-600 shadow-lg' : 'border-2 hover:border-blue-400'
            }`}
            onClick={() => setSelectedRole('ORGANIZER')}
          >
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div
                  className={`p-4 rounded-full transition-colors ${
                    selectedRole === 'ORGANIZER' ? 'bg-primary' : 'bg-primary/10 dark:bg-primary/20'
                  }`}
                >
                  <Calendar className={`h-12 w-12 ${selectedRole === 'ORGANIZER' ? 'text-white' : 'text-primary'}`} />
                </div>
              </div>
              <CardTitle className="text-2xl">Event Organizer</CardTitle>
              <CardDescription className="text-base">Manage events, monitor crowds, ensure safety</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-success-green mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Create and manage events with 7-step wizard</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-success-green mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Live crowd monitoring with AI predictions (USP 1)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-success-green mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Triple-layer anomaly detection (USP 2)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-success-green mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Auto-dispatch teams & broadcast alerts (USP 4)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-success-green mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Multi-model switching for event types (USP 5)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-success-green mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Post-event analytics & AI learning (USP 6)</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Attendee Card */}
          <Card
            className={`cursor-pointer transition-all hover:shadow-xl ${
              selectedRole === 'ATTENDEE' ? 'border-4 border-accent shadow-lg' : 'border-2 hover:border-accent/40'
            }`}
            onClick={() => setSelectedRole('ATTENDEE')}
          >
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div
                  className={`p-4 rounded-full transition-colors ${
                    selectedRole === 'ATTENDEE' ? 'bg-accent' : 'bg-accent/10 dark:bg-accent/20'
                  }`}
                >
                  <Users className={`h-12 w-12 ${selectedRole === 'ATTENDEE' ? 'text-white' : 'text-accent'}`} />
                </div>
              </div>
              <CardTitle className="text-2xl">Attendee / Participant</CardTitle>
              <CardDescription className="text-base">Join events, navigate safely, stay informed</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-success-green mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Join events via QR code, event code, or browse</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-success-green mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Live venue map with crowd heatmap</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-success-green mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Crowd-aware navigation with ETA (USP 4)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-success-green mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Real-time safety alerts & route suggestions</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-success-green mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">One-touch SOS emergency button</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-success-green mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Event schedule & offline map support</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!selectedRole}
            className={`px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all ${
              selectedRole === 'ORGANIZER'
                ? 'bg-primary hover:bg-primary/90'
                : selectedRole === 'ATTENDEE'
                  ? 'bg-accent hover:bg-accent/90'
                  : ''
            }`}
          >
            Continue as {selectedRole === 'ORGANIZER' ? 'Organizer' : selectedRole === 'ATTENDEE' ? 'Attendee' : '...'}
          </Button>
          {!selectedRole && <p className="text-sm text-gray-500 mt-4">Please select a role to continue</p>}
        </div>

        {/* Info Section */}
        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Already have an account?{' '}
            <button onClick={() => navigate('/auth/login')} className="text-blue-600 hover:underline font-medium">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
