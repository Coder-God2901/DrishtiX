import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, CheckCircle2 } from 'lucide-react';

/**
 * Login Page
 * Handles authentication for both attendees and organizers
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'attendee' | 'organizer'>('attendee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      if (userType === 'attendee') {
        navigate('/attendee/dashboard');
      } else {
        navigate('/organizer/home');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent mb-2">
            DrishtiX
          </h1>
          <p className="text-slate-400">AI-Powered Event Intelligence Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8">
          {/* User Type Selection */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setUserType('attendee')}
              className={`flex-1 p-4 rounded-xl border transition-all ${
                userType === 'attendee'
                  ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <Users className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">Attendee</div>
            </button>
            <button
              onClick={() => setUserType('organizer')}
              className={`flex-1 p-4 rounded-xl border transition-all ${
                userType === 'organizer'
                  ? 'bg-violet-500/10 border-violet-500 text-violet-400'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <Shield className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">Organizer</div>
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-medium transition-all ${
                userType === 'attendee'
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-violet-500 hover:bg-violet-600 text-white'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
            <div className="text-xs text-slate-400 mb-2">Demo Credentials:</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-3 h-3 text-blue-400" />
                <span>Email: demo@drishti.com</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-3 h-3 text-blue-400" />
                <span>Password: demo123</span>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <button
            onClick={() => navigate('/')}
            className="w-full mt-4 text-sm text-slate-400 hover:text-slate-300 transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
