import { useState } from "react";
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle,
  Shield,
} from "lucide-react";

interface LoginProps {
  userType: "organizer" | "attendee";
  onBack: () => void;
  onLoginSuccess: (userType: "organizer" | "attendee") => void;
}

export function Login({ userType, onBack, onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState(
    userType === "organizer"
      ? "organizer@drishtix.com"
      : "attendee@drishtix.com"
  );
  const [password, setPassword] = useState("demo1234");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (email && password.length >= 6) {
        onLoginSuccess(userType);
      } else {
        setError("Invalid credentials. Please try again.");
        setIsLoading(false);
      }
    }, 1500);
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      onLoginSuccess(userType);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/20 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl p-12 text-white shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">DrishtiX</h1>
                <p className="text-purple-100">AI-Powered Events</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold mb-6">
              {userType === "organizer"
                ? "Manage Events Like Never Before"
                : "Discover Amazing Events"}
            </h2>

            <div className="space-y-4">
              {userType === "organizer" ? (
                <>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">Real-Time Analytics</p>
                      <p className="text-purple-100 text-sm">
                        Monitor crowd density, safety metrics, and attendance
                        live
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">AI-Powered Safety</p>
                      <p className="text-purple-100 text-sm">
                        Predictive alerts and intelligent incident management
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">Operations Command</p>
                      <p className="text-purple-100 text-sm">
                        Coordinate teams and respond to incidents instantly
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">Smart Navigation</p>
                      <p className="text-purple-100 text-sm">
                        Find your way with live crowd-aware routing
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">Safety First</p>
                      <p className="text-purple-100 text-sm">
                        Real-time alerts and emergency assistance
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">
                        Personalized Experience
                      </p>
                      <p className="text-purple-100 text-sm">
                        Discover events tailored to your interests
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-green-400" />
                <p className="font-semibold">Secure & Encrypted</p>
              </div>
              <p className="text-purple-100 text-sm">
                Your data is protected with enterprise-grade security and
                encryption
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-slate-200">
            <div className="mb-8">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>

              <div className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm mb-4">
                {userType === "organizer"
                  ? "🎯 Event Organizer"
                  : "🎉 Event Attendee"}
              </div>

              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Welcome Back!
              </h2>
              <p className="text-slate-600">
                Sign in to continue to your{" "}
                {userType === "organizer" ? "dashboard" : "events"}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-slate-700 font-medium mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-slate-700 font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-12 py-3.5 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm text-slate-600">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <Sparkles className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Demo Login */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">
                    Quick access
                  </span>
                </div>
              </div>

              <button
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="mt-6 w-full py-3 border-2 border-purple-600 text-purple-600 rounded-xl hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🚀 Continue with Demo Account
              </button>
            </div>

            {/* Sign Up Link */}
            <p className="mt-8 text-center text-slate-600">
              Don't have an account?{" "}
              <button className="text-purple-600 hover:text-purple-700 font-medium">
                Sign up now
              </button>
            </p>
          </div>

          {/* Mobile Branding */}
          <div className="lg:hidden mt-8 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-600">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Secure & Encrypted Login</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
