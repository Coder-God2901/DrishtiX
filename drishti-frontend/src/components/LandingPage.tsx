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

interface LandingPageProps {
  onLogin: (userType: "organizer" | "attendee") => void;
}

export default function LandingPage({ onLogin }: LandingPageProps) {
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
      gradient: "from-orange-500 to-amber-400",
    },
    {
      icon: Zap,
      title: "Real-Time Operations",
      description:
        "Command center for instant incident response and team coordination",
      gradient: "from-indigo-500 to-purple-400",
    },
    {
      icon: Calendar,
      title: "Event Management",
      description:
        "Complete event lifecycle management from creation to execution",
      gradient: "from-rose-500 to-pink-400",
    },
  ];

  const stats = [
    { value: "50K+", label: "Events Managed", icon: Calendar },
    { value: "2M+", label: "Happy Attendees", icon: Users },
    { value: "99.8%", label: "Safety Score", icon: Shield },
    { value: "24/7", label: "Support", icon: Activity },
  ];

  const benefits = [
    {
      icon: Lock,
      title: "Enterprise Security",
      description: "Bank-grade encryption and data protection",
      gradient: "from-blue-500 to-cyan-400",
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Worldwide support in 50+ countries",
      gradient: "from-purple-500 to-pink-400",
    },
    {
      icon: Award,
      title: "Award Winning",
      description: "Industry leader and trusted platform",
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      icon: Wifi,
      title: "Real-Time Updates",
      description: "Instant synchronization across all devices",
      gradient: "from-orange-500 to-amber-400",
    },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 lg:py-6">
          <div className="flex items-center justify-between">
            {/* Left: logo */}
            <div className="flex-1 flex items-center justify-start gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">DrishtiX</h1>
                <p className="text-xs text-blue-600 font-medium -mt-0.5">AI-Powered Events</p>
              </div>
            </div>

            {/* Center: nav links (centered) */}
            <div className="hidden xl:flex flex-none items-center justify-center">
              <nav className="flex items-center gap-8">
                <a href="#features" className="text-slate-600 font-medium hover:text-blue-600 transition-colors">Features</a>
                <a href="#how-it-works" className="text-slate-600 font-medium hover:text-blue-600 transition-colors">How It Works</a>
                <a href="#pricing" className="text-slate-600 font-medium hover:text-blue-600 transition-colors">Pricing</a>
              </nav>
            </div>

            {/* Right: actions */}
            <div className="hidden xl:flex items-center justify-end gap-4">
              <button
              type="button"
              onClick={() => onLogin("attendee")}
              className="text-slate-600 text-sm hover:text-blue-600 transition-colors"
              >
              Sign In
              </button>
              <button
              type="button"
              onClick={() => onLogin("organizer")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-2xl transition-all"
              >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile menu toggle */}
            {/* <div className="xl:hidden flex flex-1 justify-end">
              <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div> */}
          </div>

          {showMobileMenu && (
            <div className="xl:hidden mt-4 pb-4 space-y-2 border-t border-slate-200 pt-4">
              <a
                href="#features"
                className="block px-4 py-3 text-slate-700 font-semibold hover:bg-slate-50 rounded-lg transition-all"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="block px-4 py-3 text-slate-700 font-semibold hover:bg-slate-50 rounded-lg transition-all"
              >
                How It Works
              </a>
              <a
                href="#pricing"
                className="block px-4 py-3 text-slate-700 font-semibold hover:bg-slate-50 rounded-lg transition-all"
              >
                Pricing
              </a>
              <button
                onClick={() => onLogin("attendee")}
                className="w-full px-4 py-3 text-slate-700 font-semibold bg-slate-50 rounded-lg transition-all text-left"
              >
                Sign In
              </button>
              <button
                onClick={() => onLogin("organizer")}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-32 w-full">
        {/* Background Gradients */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-100 to-pink-100 rounded-full blur-3xl opacity-60" />
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
              <span className="text-blue-600 text-xs font-medium">
                ← Next Gen Event Management Platform
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black text-slate-900 leading-tight">
              Transform Events with{" "}
              <span className="text-blue-600">
                AI Intelligence
              </span>
            </h1>

            <p className="text-base text-slate-600 leading-relaxed">
              DrishtiX combines cutting-edge AI, real-time analytics, and smart
              safety monitoring to create extraordinary event experiences.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => onLogin("organizer")}
                className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                Get As Organizer
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onLogin("attendee")}
                className="px-6 py-3 bg-white text-slate-700 text-sm font-medium rounded-md border border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                Join as Attendee
                <Users className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>
              <span className="text-slate-600 text-sm">
                Trusted by 10,000+ organizers
              </span>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="flex justify-end lg:mt-8">
            <div className="relative bg-white rounded-xl p-5 border border-slate-200 shadow-xl w-full max-w-md">
              {/* Window Controls */}
              <div className="flex items-center gap-1.5 mb-5 pb-3 border-b border-slate-200">
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="ml-auto text-xs text-slate-400">
                  LIVE DASHBOARD
                </span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    label: "Live Attendees",
                    value: "12,847",
                    trend: "+342",
                    gradient: "from-blue-400 to-blue-500",
                    bg: "bg-blue-50",
                    text: "text-slate-900",
                  },
                  {
                    label: "Safety Score",
                    value: "94%",
                    trend: "+2%",
                    gradient: "from-green-400 to-green-500",
                    bg: "bg-green-50",
                    text: "text-slate-900",
                  },
                  {
                    label: "Active Alerts",
                    value: "3",
                    trend: "-2",
                    gradient: "from-orange-400 to-orange-500",
                    bg: "bg-orange-50",
                    text: "text-slate-900",
                  },
                ].map((metric, i) => (
                  <div
                    key={i}
                    className={`${metric.bg} rounded-lg p-3`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-500 text-xs">
                        {metric.label}
                      </span>
                      <span className="text-green-600 text-xs bg-green-100 px-1.5 py-0.5 rounded">
                        {metric.trend}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <p className={`${metric.text} text-xl font-bold`}>
                        {metric.value}
                      </p>
                      <div
                        className={`w-10 h-7 bg-gradient-to-r ${metric.gradient} rounded opacity-90`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Indicator */}
              <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-400">
                <span>+ Add New Data</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative bg-slate-50 py-12 lg:py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center space-y-2 bg-blue-600 text-white rounded-xl p-6 shadow-md min-h-[140px] flex flex-col justify-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg mb-1">
                    <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <p className="text-3xl lg:text-4xl font-bold">
                    {stat.value}
                  </p>
                  <p className="text-white/90 text-sm">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32"
      >
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full mb-4">
            <span className="text-blue-600 text-xs font-medium">
              ⚡ Powerful Features
            </span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Everything You Need for{" "}<span className="text-blue-600">Exceptional Events</span>
          </h2>
          <p className="text-base text-slate-600 max-w-2xl mx-auto">
            Comprehensive tools designed to elevate every aspect of your event
            management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-all"
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center mb-4`}
                >
                  <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-8 pb-16 lg:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-all group"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${benefit.gradient} rounded-lg flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h4 className="text-slate-900 font-bold text-lg mb-2">{benefit.title}</h4>
                <p className="text-slate-600 text-sm">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 py-20 lg:py-32 overflow-hidden"
      >
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 2px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <span className="text-white text-xs font-medium">
                🔄 Simple Process
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-base text-white/90 max-w-2xl mx-auto">
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
                  className="relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all group"
                >
                  <div className="text-7xl font-black text-white/20 mb-4">
                    {step.step}
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4 leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-white/90 leading-relaxed mb-6">
                    {step.description}
                  </p>
                  <CheckCircle className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
            Trusted by Industry Leaders
          </h2>
          <p className="text-base text-slate-600">
            Join thousands of successful events powered by DrishtiX
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Target, gradient: "from-blue-500 to-cyan-400" },
            { icon: BarChart3, gradient: "from-purple-500 to-pink-400" },
            { icon: Award, gradient: "from-emerald-500 to-teal-400" },
            { icon: Headphones, gradient: "from-orange-500 to-amber-400" },
            { icon: Globe, gradient: "from-indigo-500 to-purple-400" },
            { icon: Lock, gradient: "from-cyan-500 to-blue-400" },
            { icon: Building2, gradient: "from-pink-500 to-rose-400" },
            { icon: Activity, gradient: "from-yellow-500 to-orange-400" },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="aspect-video bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-xl flex items-center justify-center hover:shadow-lg transition-all group hover:scale-105 duration-300"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${item.gradient} rounded-lg flex items-center justify-center shadow-md`}>
                  <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-8 pb-20 lg:pb-32">
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-12 lg:p-20 text-center overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <span className="text-white text-xs font-medium">
                ✨ Ready to Get Started?
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Transform Your Events Today
            </h2>
            <p className="text-base text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of organizers and millions of attendees using
              DrishtiX to create unforgettable experiences
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onLogin("organizer")}
                className="group px-10 py-4 bg-white text-blue-600 font-black rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              <button
                onClick={() => onLogin("attendee")}
                className="px-10 py-4 bg-white/10 backdrop-blur-sm text-white font-black rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all hover:scale-105"
              >
                Explore Events
              </button>
            </div>
          </div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-slate-50 to-blue-50 border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-xl font-bold text-slate-900">
                  DrishtiX
                </span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-slate-600">
              <a href="#" className="font-semibold hover:text-blue-600 transition-colors">
                Privacy
              </a>
              <a href="#" className="font-semibold hover:text-blue-600 transition-colors">
                Terms
              </a>
              <a href="#" className="font-semibold hover:text-blue-600 transition-colors">
                Support
              </a>
              <a href="#" className="font-semibold hover:text-blue-600 transition-colors">
                Contact
              </a>
            </div>
          </div>
          <div className="text-center text-slate-500 pt-8 border-t border-slate-200">
            <p className="text-sm">
              © 2025 DrishtiX. All rights reserved. AI-Powered Event Intelligence Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
