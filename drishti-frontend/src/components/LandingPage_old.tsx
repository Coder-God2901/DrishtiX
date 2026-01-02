import { useState } from "react";
import {
  Sparkles,
  Calendar,
  Shield,
  Users,
  TrendingUp,
  MapPin,
  Zap,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  Activity,
  Star,
  Award,
  Globe,
  Lock,
  Clock,
  BarChart3,
  Target,
  Headphones,
  Building2,
  Wifi,
  ChevronRight,
} from "lucide-react";

export default function LandingPage({ onLogin = () => {} }) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const features = [
    {
      icon: Shield,
      title: "Smart Safety Monitoring",
      description:
        "Real-time crowd analytics and AI-powered safety alerts for proactive incident prevention",
      gradient: "from-blue-500 to-cyan-400",
    },
    {
      icon: MapPin,
      title: "Interactive Venue Maps",
      description:
        "Navigate seamlessly with live heat maps showing crowd density and optimal routes",
      gradient: "from-purple-500 to-pink-400",
    },
    {
      icon: Users,
      title: "Attendee Experience",
      description:
        "Personalized event discovery, smart ticketing, and accessibility features",
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      icon: TrendingUp,
      title: "Live Analytics Dashboard",
      description:
        "Comprehensive insights and metrics for data-driven event management",
      gradient: "from-orange-600 to-red-500",
    },
    {
      icon: Zap,
      title: "Real-Time Operations",
      description:
        "Command center for instant incident response and team coordination",
      gradient: "from-yellow-600 to-orange-500",
    },
    {
      icon: Calendar,
      title: "Event Management",
      description:
        "Complete event lifecycle management from creation to execution",
      gradient: "from-indigo-600 to-purple-500",
    },
  ];

  const stats = [
    {
      value: "50K+",
      label: "Events Managed",
      icon: Calendar,
      color: "from-blue-500 to-cyan-400",
    },
    {
      value: "2M+",
      label: "Happy Attendees",
      icon: Users,
      color: "from-purple-500 to-pink-400",
    },
    {
      value: "99.8%",
      label: "Safety Score",
      icon: Shield,
      color: "from-emerald-500 to-teal-400",
    },
    {
      value: "24/7",
      label: "Support",
      icon: Activity,
      color: "from-orange-500 to-red-400",
    },
  ];

  const benefits = [
    {
      icon: Lock,
      title: "Enterprise Security",
      description: "Bank-grade encryption",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Worldwide support",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Award,
      title: "Award Winning",
      description: "Industry leader",
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: Clock,
      title: "Real-Time Updates",
      description: "Instant synchronization",
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-x-hidden w-full relative">
      {/* Navigation */}
      <nav className="relative bg-slate-900 border-b-2 border-slate-700 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/50">
                  <Sparkles className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  DrishtiX
                </h1>
                <p className="text-xs text-blue-400 font-semibold">
                  AI-Powered Events
                </p>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-8">
              <a
                href="#features"
                className="text-white font-semibold text-sm hover:text-blue-400 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-white font-semibold text-sm hover:text-blue-400 transition-colors"
              >
                How It Works
              </a>
              <a
                href="#pricing"
                className="text-white font-semibold text-sm hover:text-blue-400 transition-colors"
              >
                Pricing
              </a>
              <div className="flex items-center gap-3 ml-4">
                <button
                  onClick={() => onLogin("attendee")}
                  className="px-5 py-2.5 text-white font-semibold text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition-all border border-slate-600 hover:border-slate-500"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onLogin("organizer")}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold text-sm rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105"
                >
                  <span className="flex items-center gap-2">
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-3 text-white hover:bg-slate-800 rounded-xl transition-all border-2 border-slate-700"
            >
              {showMobileMenu ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {showMobileMenu && (
            <div className="lg:hidden mt-4 pb-4 space-y-2 border-t border-slate-700 pt-4">
              <a
                href="#features"
                className="block px-4 py-2.5 text-white font-semibold text-sm hover:bg-slate-800 rounded-lg transition-all"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="block px-4 py-2.5 text-white font-semibold text-sm hover:bg-slate-800 rounded-lg transition-all"
              >
                How It Works
              </a>
              <a
                href="#pricing"
                className="block px-4 py-2.5 text-white font-semibold text-sm hover:bg-slate-800 rounded-lg transition-all"
              >
                Pricing
              </a>
              <button
                onClick={() => onLogin("attendee")}
                className="w-full px-4 py-2.5 text-white font-semibold text-sm bg-slate-800 rounded-lg transition-all text-left border border-slate-700"
              >
                Sign In
              </button>
              <button
                onClick={() => onLogin("organizer")}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold text-sm rounded-lg shadow-lg"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-36 w-full">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute top-20 right-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white font-semibold text-xs">
                Next-Gen Event Management Platform
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-tight">
              Transform Events with
              <span className="block mt-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Intelligence
              </span>
            </h1>

            <p className="text-base lg:text-lg text-slate-300 leading-relaxed font-medium max-w-xl">
              DrishtiX combines cutting-edge AI, real-time analytics, and smart
              safety monitoring to create extraordinary event experiences.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => onLogin("organizer")}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  Start as Organizer
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
              <button
                onClick={() => onLogin("attendee")}
                className="px-6 py-3 bg-slate-800 text-white font-bold text-sm rounded-xl border-2 border-slate-600 hover:bg-slate-700 hover:border-slate-500 transition-all hover:scale-105 shadow-lg"
              >
                <span className="flex items-center justify-center gap-2">
                  Join as Attendee
                  <Sparkles className="w-4 h-4" />
                </span>
              </button>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>
              <span className="text-white text-xs font-semibold">
                Trusted by 10,000+ organizers
              </span>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-2xl opacity-30 animate-pulse" />
            <div className="relative bg-slate-800 rounded-2xl p-6 border-2 border-slate-600 shadow-2xl">
              {/* Window Controls */}
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-600">
                <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm shadow-red-500/50" />
                <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm shadow-yellow-500/50" />
                <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm shadow-emerald-500/50" />
                <span className="ml-auto text-xs text-slate-400 font-bold font-mono">
                  LIVE DASHBOARD
                </span>
              </div>

              <div className="space-y-4">
                {[
                  {
                    label: "Live Attendees",
                    value: "12,847",
                    trend: "+342",
                    gradient: "from-blue-500 to-cyan-400",
                  },
                  {
                    label: "Safety Score",
                    value: "94%",
                    trend: "+2%",
                    gradient: "from-emerald-500 to-teal-400",
                  },
                  {
                    label: "Active Alerts",
                    value: "3",
                    trend: "-2",
                    gradient: "from-orange-500 to-red-400",
                  },
                ].map((metric, i) => (
                  <div
                    key={i}
                    className="bg-slate-900 border border-slate-600 rounded-xl p-4 hover:border-slate-500 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center justify-between mb-3">
                      <span className="text-white text-sm font-semibold">
                        {metric.label}
                      </span>
                      <span className="text-emerald-400 font-bold text-xs bg-emerald-500/20 px-2 py-1 rounded-md border border-emerald-500/30">
                        {metric.trend}
                      </span>
                    </div>
                    <div className="relative flex items-end justify-between">
                      <p className="text-white text-3xl font-black">
                        {metric.value}
                      </p>
                      <div
                        className={`w-16 h-10 bg-gradient-to-r ${metric.gradient} rounded-lg opacity-50 shadow-lg`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Indicator */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white font-bold">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/50" />
                <span>REAL-TIME DATA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative bg-slate-900 border-y-2 border-slate-700 py-20 lg:py-24 my-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center space-y-3 group">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-800 border-2 border-slate-600 rounded-xl mb-3 group-hover:scale-110 transition-transform shadow-lg">
                    <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <p
                    className={`text-4xl lg:text-5xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                  >
                    {stat.value}
                  </p>
                  <p className="text-white font-semibold text-sm">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="relative max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6 shadow-lg">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            <span className="text-white font-semibold text-xs">
              Powerful Features
            </span>
          </div>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black text-white mb-4">
            Everything You Need for
            <span className="block mt-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Exceptional Events
            </span>
          </h2>
          <p className="text-base lg:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
            Comprehensive tools designed to elevate every aspect of your event
            management
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group bg-slate-900 rounded-2xl p-8 border-2 border-slate-700 hover:border-slate-600 transition-all hover:scale-105 duration-300 shadow-xl relative overflow-hidden aspect-square flex flex-col"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex flex-col h-full">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-black text-white mb-4 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-medium flex-1">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="bg-slate-900 rounded-xl p-8 border-2 border-slate-700 hover:border-slate-600 transition-all group shadow-lg relative overflow-hidden aspect-square flex flex-col"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex flex-col h-full">
                  <div
                    className={`w-14 h-14 bg-gradient-to-br ${benefit.color} rounded-lg flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <h4 className="text-white font-black text-xl mb-3">
                    {benefit.title}
                  </h4>
                  <p className="text-sm text-slate-300 font-medium flex-1">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-24 lg:py-32 overflow-hidden my-12"
      >
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Animated Background Orbs */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-full mb-6 shadow-lg">
              <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
              <span className="text-white font-semibold text-xs">
                Simple Process
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black text-white mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-base lg:text-lg text-white/90 max-w-3xl mx-auto leading-relaxed font-medium">
              Three simple steps to transform your event management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Choose Your Role",
                description:
                  "Sign up as an Event Organizer to manage events or as an Attendee to discover experiences",
                icon: Users,
              },
              {
                step: "02",
                title: "Setup & Configure",
                description:
                  "Organizers create events with venue maps. Attendees browse and register for events",
                icon: Calendar,
              },
              {
                step: "03",
                title: "Execute & Experience",
                description:
                  "Real-time monitoring, live updates, and seamless event management or attendance",
                icon: Zap,
              },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="relative bg-white/15 backdrop-blur-md rounded-2xl p-8 border-2 border-white/30 hover:bg-white/20 transition-all group shadow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                  <div className="relative">
                    <div className="text-5xl font-black text-white/30 mb-4">
                      {step.step}
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-5 shadow-lg backdrop-blur-sm">
                      <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-xl font-black text-white mb-3 leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm text-white/90 leading-relaxed mb-5 font-medium">
                      {step.description}
                    </p>
                    <CheckCircle
                      className="w-7 h-7 text-white"
                      strokeWidth={2.5}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-28">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-black text-white mb-3">
            Trusted by Industry Leaders
          </h2>
          <p className="text-base lg:text-lg text-slate-300 font-medium">
            Join thousands of successful events powered by DrishtiX
          </p>
        </div>

        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Target, gradient: "from-blue-500 to-cyan-400" },
            { icon: BarChart3, gradient: "from-purple-500 to-pink-400" },
            { icon: Award, gradient: "from-emerald-500 to-teal-400" },
            { icon: Headphones, gradient: "from-orange-500 to-red-400" },
            { icon: Globe, gradient: "from-indigo-500 to-purple-400" },
            { icon: Lock, gradient: "from-cyan-500 to-blue-400" },
            { icon: Clock, gradient: "from-pink-500 to-rose-400" },
            { icon: Activity, gradient: "from-yellow-500 to-orange-400" },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="aspect-square bg-slate-900 border-2 border-slate-700 rounded-xl flex items-center justify-center hover:border-slate-600 transition-all group shadow-lg hover:scale-105 duration-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div
                  className={`relative w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-lg flex items-center justify-center shadow-md`}
                >
                  <Icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-28">
        <div className="relative bg-slate-900 rounded-2xl p-12 lg:p-16 text-center border-2 border-slate-700 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />

          {/* Animated Background Orbs */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6 shadow-lg">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
              <span className="text-white font-semibold text-xs">
                Ready to Elevate Your Events?
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">
              Join DrishtiX Today
            </h2>
            <p className="text-base lg:text-lg text-slate-300 leading-relaxed font-medium max-w-3xl mx-auto mb-8">
              Experience the future of event management with our AI-powered
              platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onLogin("organizer")}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  Get Started as Organizer
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
              <button
                onClick={() => onLogin("attendee")}
                className="px-6 py-3 bg-slate-800 text-white font-bold text-sm rounded-xl border-2 border-slate-600 hover:bg-slate-700 hover:border-slate-500 transition-all hover:scale-105 shadow-lg"
              >
                <span className="flex items-center justify-center gap-2">
                  Join as Attendee
                  <Sparkles className="w-4 h-4" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="relative w-full bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-t-2 border-slate-800 mt-16 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
              <Sparkles className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tight">
                DrishtiX
              </span>
              <span className="block text-xs text-blue-400 font-semibold">
                AI-Powered Events
              </span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <a
              href="#features"
              className="text-white/80 hover:text-blue-400 font-medium text-sm transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-white/80 hover:text-blue-400 font-medium text-sm transition-colors"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="text-white/80 hover:text-blue-400 font-medium text-sm transition-colors"
            >
              Pricing
            </a>
          </div>
        </div>
        <div className="border-t border-slate-800 py-6 text-center text-xs text-slate-400 bg-slate-900/80">
          &copy; {new Date().getFullYear()} DrishtiX. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
