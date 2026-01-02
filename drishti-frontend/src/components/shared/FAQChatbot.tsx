import { useState, useRef, useEffect } from "react";
import {
  X,
  Search,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Bot,
  User,
  Sparkles,
  Calendar,
  Shield,
  MapPin,
  TrendingUp,
  Database,
  Users,
  Bell,
  Layers,
  Zap,
  BarChart3,
  Lock,
  CreditCard,
  AlertTriangle,
  Activity,
  Ticket,
  Navigation,
  Smartphone,
  Phone,
  Clock,
  Filter,
} from "lucide-react";

interface FAQChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage?: string;
}

interface FAQ {
  id: number;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  icon: any;
  relatedPages?: string[];
}

interface Message {
  id: number;
  type: "user" | "bot";
  text: string;
  timestamp: Date;
  suggestions?: string[];
}

export function FAQChatbot({
  isOpen,
  onClose,
  currentPage = "general",
}: FAQChatbotProps) {
  const [activeTab, setActiveTab] = useState<"faq" | "chat">("faq");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "bot",
      text: `Hi! I'm your DrishtiX AI assistant. How can I help you today?`,
      timestamp: new Date(),
      suggestions: [
        "How do I create an event?",
        "Tell me about DrishtiX AI",
        "How does navigation work?",
        "Explain capacity management",
      ],
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const faqs: FAQ[] = [
    // ORGANIZER FAQs
    {
      id: 1,
      category: "organizer",
      question: "How do I create and configure my first event on DrishtiX?",
      answer:
        "Creating your first event is simple and intuitive. Navigate to the Event Management Hub and click 'Create New Event'. You'll be guided through a step-by-step workflow covering event details, venue mapping, scheduling, team assignments, and analytics setup. Each step includes validation to ensure your event is production-ready.",
      keywords: [
        "create",
        "event",
        "setup",
        "configuration",
        "new event",
        "first time",
      ],
      icon: Calendar,
      relatedPages: ["dashboard", "event-management"],
    },
    {
      id: 2,
      category: "organizer",
      question: "What is DrishtiX AI and how does it enhance event safety?",
      answer:
        "DrishtiX is our revolutionary AI-powered crowd safety monitoring system. It uses machine learning algorithms to analyze real-time crowd density, predict potential safety risks, and provide actionable alerts. The system monitors crowd flow patterns, detects anomalies, and suggests preventive measures before incidents occur, ensuring maximum safety for your attendees.",
      keywords: [
        "drishtix",
        "AI",
        "safety",
        "crowd monitoring",
        "prediction",
        "machine learning",
      ],
      icon: Shield,
      relatedPages: ["dashboard", "operations"],
    },
    {
      id: 3,
      category: "organizer",
      question:
        "How do I design and customize venue layouts with zones and gates?",
      answer:
        "Our Premium Venue Mapper allows you to create detailed venue layouts with drag-and-drop functionality. Add multiple zones (VIP, General, Food Court, etc.), define entry/exit gates, set capacity limits, and configure amenities. The Canvas Editor provides advanced customization with layer management, grid snapping, and real-time preview.",
      keywords: [
        "venue",
        "layout",
        "zones",
        "gates",
        "mapper",
        "design",
        "customization",
      ],
      icon: MapPin,
      relatedPages: ["venue-mapper", "canvas-editor"],
    },
    {
      id: 4,
      category: "organizer",
      question:
        "How does real-time analytics and monitoring work during live events?",
      answer:
        "DrishtiX provides comprehensive real-time analytics through the Operations Dashboard. Monitor attendee flow, track zone occupancy, view live heatmaps, analyze crowd density, and receive instant alerts. All data is updated every few seconds, giving you complete situational awareness to make informed decisions during your event.",
      keywords: [
        "analytics",
        "monitoring",
        "real-time",
        "dashboard",
        "live data",
        "metrics",
      ],
      icon: TrendingUp,
      relatedPages: ["operations", "analytics"],
    },
    {
      id: 5,
      category: "organizer",
      question:
        "What is the Venue Data Pipeline and how does it streamline data import?",
      answer:
        "The Venue Data Pipeline is an automated system that imports, validates, and transforms venue data from various sources (CSV, JSON, Excel). It handles bulk imports, detects duplicates, validates data integrity, and seamlessly integrates with your existing venues. This saves hours of manual data entry and ensures accuracy.",
      keywords: [
        "pipeline",
        "data import",
        "CSV",
        "bulk upload",
        "automation",
        "integration",
      ],
      icon: Database,
      relatedPages: ["master-data"],
    },
    {
      id: 6,
      category: "organizer",
      question:
        "How do I manage team roles, permissions, and volunteer assignments?",
      answer:
        "The Team Management system allows you to create custom roles (Security, Medical, Coordination), assign specific permissions, and deploy volunteers to zones. Each team member gets tailored access based on their role. You can track assignments, manage schedules, and communicate with teams through the integrated dashboard.",
      keywords: [
        "team",
        "roles",
        "permissions",
        "volunteers",
        "staff",
        "assignments",
      ],
      icon: Users,
      relatedPages: ["operations", "team-management"],
    },
    {
      id: 7,
      category: "organizer",
      question: "What alert types and risk levels does the system monitor?",
      answer:
        "DrishtiX monitors multiple risk levels: Low (informational), Medium (attention needed), High (immediate action), and Critical (emergency response). Alerts cover crowd density, zone capacity breaches, flow bottlenecks, emergency situations, weather conditions, and system anomalies. Each alert includes recommended actions and escalation protocols.",
      keywords: [
        "alerts",
        "risk",
        "notifications",
        "warnings",
        "emergency",
        "monitoring",
      ],
      icon: Bell,
      relatedPages: ["operations", "alerts"],
    },
    {
      id: 8,
      category: "organizer",
      question:
        "How does the Digital Twin feature help visualize my event in real-time?",
      answer:
        "The Digital Twin creates a virtual replica of your physical event space with live data overlay. Watch as attendee movements are rendered in 3D, see real-time crowd density visualizations, and simulate different scenarios. This powerful tool helps you understand crowd dynamics and make data-driven decisions instantly.",
      keywords: [
        "digital twin",
        "3D visualization",
        "simulation",
        "virtual venue",
        "real-time view",
      ],
      icon: Layers,
      relatedPages: ["operations", "digital-twin"],
    },
    {
      id: 9,
      category: "organizer",
      question:
        "Can I integrate DrishtiX with my existing ticketing and CRM systems?",
      answer:
        "Yes! DrishtiX offers robust API integration with major ticketing platforms (Eventbrite, Ticketmaster), CRM systems (Salesforce, HubSpot), and payment gateways. Our RESTful API and webhooks allow seamless data synchronization, automated attendee imports, and real-time status updates across all your systems.",
      keywords: [
        "integration",
        "API",
        "ticketing",
        "CRM",
        "third-party",
        "sync",
        "webhooks",
      ],
      icon: Zap,
      relatedPages: ["settings", "integrations"],
    },
    {
      id: 10,
      category: "organizer",
      question: "How do I export analytics reports and event performance data?",
      answer:
        "The Analytics Hub provides comprehensive reporting tools. Export data in multiple formats (PDF, Excel, CSV, JSON) with customizable date ranges and metrics. Generate automated reports for stakeholders, create custom dashboards, and schedule recurring reports. All data includes visualizations and can be white-labeled with your branding.",
      keywords: [
        "export",
        "reports",
        "analytics",
        "data",
        "PDF",
        "Excel",
        "documentation",
      ],
      icon: BarChart3,
      relatedPages: ["analytics", "reports"],
    },
    {
      id: 11,
      category: "organizer",
      question:
        "What security measures protect my event data and attendee information?",
      answer:
        "DrishtiX implements enterprise-grade security: AES-256 encryption for data at rest, TLS 1.3 for data in transit, role-based access control (RBAC), multi-factor authentication (MFA), regular security audits, GDPR compliance, and SOC 2 Type II certification. Your data is backed up hourly with 99.9% uptime guarantee.",
      keywords: [
        "security",
        "encryption",
        "privacy",
        "GDPR",
        "compliance",
        "data protection",
      ],
      icon: Lock,
      relatedPages: ["settings", "security"],
    },
    {
      id: 12,
      category: "organizer",
      question:
        "How does the Master Data Hub centralize all event-related information?",
      answer:
        "The Master Data Hub is your centralized repository for venues, events, attendees, teams, zones, gates, alerts, and analytics. It provides a single source of truth with data validation, relationship mapping, and cross-referencing capabilities. Easily search, filter, and manage all your data from one unified interface.",
      keywords: [
        "master data",
        "centralized",
        "database",
        "repository",
        "data management",
      ],
      icon: Database,
      relatedPages: ["master-data"],
    },
    {
      id: 13,
      category: "organizer",
      question: "How do I handle capacity management and prevent overcrowding?",
      answer:
        "DrishtiX provides intelligent capacity management with real-time tracking per zone and venue. Set maximum capacities, receive alerts at 70%, 85%, and 95% thresholds, and implement automated gate control. The AI predicts crowd buildup and suggests proactive measures like opening additional zones or redirecting flow.",
      keywords: [
        "capacity",
        "overcrowding",
        "limits",
        "zone management",
        "crowd control",
      ],
      icon: Users,
      relatedPages: ["venue-mapper", "operations"],
    },
    {
      id: 14,
      category: "organizer",
      question:
        "What happens if I need to pause or cancel my event during live operations?",
      answer:
        "DrishtiX provides emergency controls to pause or cancel events instantly. Pausing freezes attendee entry while maintaining monitoring, useful for temporary issues. Cancellation triggers automated notifications to all attendees, refund processing (if integrated), and archives event data. You can resume paused events or convert cancellations to reschedules.",
      keywords: [
        "cancel",
        "pause",
        "emergency",
        "stop event",
        "postpone",
        "reschedule",
      ],
      icon: AlertTriangle,
      relatedPages: ["operations", "event-management"],
    },
    {
      id: 15,
      category: "organizer",
      question: "How does the heatmap visualization help optimize crowd flow?",
      answer:
        "Live heatmaps use color gradients (green→yellow→red) to show crowd density across your venue in real-time. Identify congestion points, optimize staff deployment, predict bottlenecks, and guide attendees to less crowded areas. Historical heatmap playback helps you improve layouts for future events.",
      keywords: [
        "heatmap",
        "visualization",
        "crowd flow",
        "density",
        "optimization",
      ],
      icon: Activity,
      relatedPages: ["operations", "heatmap"],
    },
    {
      id: 16,
      category: "organizer",
      question: "Can I clone and reuse successful event configurations?",
      answer:
        "Absolutely! The Event CRUD Manager allows you to clone any past event with all configurations intact - venue layout, zones, gates, team assignments, schedules, and settings. Simply select an event, click 'Clone', modify the date and specific details, and launch. This saves hours of setup time for recurring events.",
      keywords: [
        "clone",
        "duplicate",
        "reuse",
        "template",
        "copy event",
        "recurring",
      ],
      icon: Calendar,
      relatedPages: ["event-management"],
    },

    // ATTENDEE FAQs
    {
      id: 17,
      category: "attendee",
      question: "How do I register and check-in for an event?",
      answer:
        "Registration is simple! Find your event in the DrishtiX app or website, complete your profile, and receive a QR code ticket. At the venue, scan your QR code at any entry gate for instant check-in. The system verifies your ticket, assigns you to the appropriate zone, and provides a digital map for navigation.",
      keywords: [
        "registration",
        "check-in",
        "ticket",
        "QR code",
        "entry",
        "attendee",
      ],
      icon: Ticket,
      relatedPages: ["attendee-dashboard"],
    },
    {
      id: 18,
      category: "attendee",
      question:
        "How do I navigate the venue and find specific zones or amenities?",
      answer:
        "The DrishtiX mobile app provides an interactive venue map with your live location (GPS-enabled). Search for zones, amenities (restrooms, food courts, first aid), and attractions. Get turn-by-turn navigation, estimated walk times, and crowd density indicators to choose the best route. Bookmarks save your favorite spots.",
      keywords: [
        "navigation",
        "map",
        "venue",
        "directions",
        "find",
        "location",
        "amenities",
      ],
      icon: Navigation,
      relatedPages: ["navigation", "venue-map"],
    },
    {
      id: 19,
      category: "attendee",
      question:
        "Will I receive notifications about important event updates and alerts?",
      answer:
        "Yes! You'll receive real-time push notifications for schedule changes, emergency alerts, crowd management updates, zone capacity warnings, and personalized recommendations. Notifications are categorized by priority (Info, Important, Urgent) and you can customize which types you want to receive in app settings.",
      keywords: [
        "notifications",
        "alerts",
        "updates",
        "push",
        "messages",
        "announcements",
      ],
      icon: Bell,
      relatedPages: ["attendee-dashboard", "notifications"],
    },
    {
      id: 20,
      category: "attendee",
      question: "What should I do in case of an emergency at the event?",
      answer:
        "Safety is our top priority. In emergencies: 1) Follow staff instructions immediately, 2) Use the app's 'Emergency' button to alert security and get evacuation routes, 3) Head to marked emergency exits (shown on your map), 4) Report incidents via the app, 5) Follow DrishtiX AI guidance for safest routes. Emergency services are integrated with the system.",
      keywords: [
        "emergency",
        "safety",
        "evacuation",
        "help",
        "security",
        "incident",
      ],
      icon: AlertTriangle,
      relatedPages: ["emergency-exit", "safety"],
    },
    {
      id: 21,
      category: "attendee",
      question: "Can I access my ticket offline without internet connectivity?",
      answer:
        "Absolutely! Once you register and download your ticket, it's stored locally on your device. Your QR code works offline for check-in. The basic venue map is also available offline. However, real-time features like navigation updates, crowd density, and notifications require internet connection.",
      keywords: [
        "offline",
        "ticket",
        "no internet",
        "QR code",
        "connectivity",
        "access",
      ],
      icon: Smartphone,
      relatedPages: ["attendee-dashboard", "tickets"],
    },
    {
      id: 22,
      category: "attendee",
      question: "How can I provide feedback or report issues during the event?",
      answer:
        "The app has a built-in feedback system accessible from the menu. Report issues (cleanliness, broken amenities, crowd problems), rate your experience, submit suggestions, and contact support. All feedback is routed to event organizers in real-time. You can attach photos, rate severity, and track resolution status.",
      keywords: [
        "feedback",
        "report",
        "issues",
        "complaints",
        "suggestions",
        "support",
      ],
      icon: HelpCircle,
      relatedPages: ["attendee-dashboard", "support"],
    },
    {
      id: 23,
      category: "attendee",
      question:
        "Are there accessibility features for attendees with disabilities?",
      answer:
        "Yes! DrishtiX is fully accessible with: wheelchair-accessible route navigation, audio guidance for visually impaired, text-to-speech announcements, accessible restroom locations, companion seating availability, sign language interpretation schedules, and priority entry lanes. Contact support for personalized assistance.",
      keywords: [
        "accessibility",
        "disabilities",
        "wheelchair",
        "audio",
        "inclusive",
        "special needs",
      ],
      icon: Users,
      relatedPages: ["navigation", "accessibility"],
    },
    {
      id: 24,
      category: "attendee",
      question:
        "What payment methods are accepted and is my payment information secure?",
      answer:
        "We accept all major credit/debit cards, digital wallets (Apple Pay, Google Pay), UPI, and net banking. All transactions use PCI-DSS compliant payment gateways with 256-bit SSL encryption. We never store your complete card details. Refunds are processed within 5-7 business days for eligible cancellations.",
      keywords: [
        "payment",
        "credit card",
        "security",
        "refund",
        "transaction",
        "billing",
      ],
      icon: CreditCard,
      relatedPages: ["payments", "security"],
    },
    {
      id: 25,
      category: "attendee",
      question: "Can I transfer or share my ticket with someone else?",
      answer:
        "Yes, ticket transfers are available for most events. Go to 'My Tickets', select the event, and choose 'Transfer Ticket'. Enter the recipient's email, and they'll receive a new QR code. The original ticket is automatically invalidated. Some VIP or personalized tickets may have transfer restrictions set by organizers.",
      keywords: [
        "transfer",
        "share",
        "ticket",
        "give",
        "send",
        "another person",
      ],
      icon: Ticket,
      relatedPages: ["tickets", "my-tickets"],
    },
    {
      id: 26,
      category: "attendee",
      question:
        "How does real-time crowd information help me avoid congested areas?",
      answer:
        "The app displays live crowd density using color-coded indicators (green=low, yellow=moderate, red=high) on the venue map. AI predicts wait times for popular attractions, suggests optimal visit times, and recommends alternative routes. You can plan your movement to avoid crowds and enjoy a more comfortable experience.",
      keywords: [
        "crowd",
        "congestion",
        "density",
        "wait times",
        "busy areas",
        "real-time",
      ],
      icon: Activity,
      relatedPages: ["venue-map", "navigation"],
    },
    {
      id: 27,
      category: "attendee",
      question: "What is the cancellation and refund policy for event tickets?",
      answer:
        "Refund policies vary by event and are clearly displayed during purchase. Generally: Full refund (100%) if canceled 7+ days before, Partial refund (50%) for 3-7 days before, No refund within 72 hours. Event cancellations by organizers result in automatic full refunds. Processing takes 5-7 business days.",
      keywords: [
        "cancellation",
        "refund",
        "policy",
        "return",
        "money back",
        "cancel ticket",
      ],
      icon: CreditCard,
      relatedPages: ["tickets", "refunds"],
    },
    {
      id: 28,
      category: "attendee",
      question:
        "How do I contact event support if I have questions or problems?",
      answer:
        "Multiple support channels are available: In-app chat (instant response during event), Email support (24-48 hour response), Phone hotline (displayed in app for emergencies), Help center with FAQs, and on-site help desks at the venue. Response times vary, but emergency issues are prioritized immediately.",
      keywords: [
        "support",
        "contact",
        "help",
        "customer service",
        "assistance",
        "questions",
      ],
      icon: Phone,
      relatedPages: ["support", "contact"],
    },
    {
      id: 29,
      category: "attendee",
      question:
        "Can I see the event schedule and get reminders for sessions I'm interested in?",
      answer:
        "Yes! The full event schedule is available in the app with session details, speaker info, and venue locations. Bookmark sessions you want to attend and receive push notifications 15 minutes before they start. Create your personalized agenda, sync with your calendar, and get smart suggestions based on your interests.",
      keywords: [
        "schedule",
        "agenda",
        "sessions",
        "reminders",
        "calendar",
        "program",
        "timing",
      ],
      icon: Clock,
      relatedPages: ["event-info", "schedule"],
    },

    // GENERAL/PLATFORM FAQs
    {
      id: 30,
      category: "general",
      question:
        "What makes DrishtiX different from other event management platforms?",
      answer:
        "DrishtiX uniquely combines AI-powered safety monitoring, real-time crowd analytics, interactive venue mapping, and dual interfaces for both organizers and attendees. Our platform provides end-to-end event lifecycle management with predictive intelligence, ensuring safer, more efficient, and memorable events.",
      keywords: [
        "difference",
        "unique",
        "features",
        "comparison",
        "why drishtix",
      ],
      icon: Sparkles,
      relatedPages: ["dashboard"],
    },
    {
      id: 31,
      category: "general",
      question: "Is there a mobile app available for both iOS and Android?",
      answer:
        "Yes! DrishtiX is available as a progressive web app (PWA) that works seamlessly on iOS, Android, and desktop browsers. Native mobile apps for iOS and Android are in development. The PWA offers full offline functionality, push notifications, and can be installed on your home screen for app-like experience.",
      keywords: [
        "mobile app",
        "iOS",
        "Android",
        "download",
        "install",
        "smartphone",
      ],
      icon: Smartphone,
      relatedPages: ["download", "mobile"],
    },
    {
      id: 32,
      category: "general",
      question:
        "How much does DrishtiX cost and are there free trials available?",
      answer:
        "We offer a free tier for small events (up to 500 attendees), Professional plan at $99/month, and Enterprise plan at $299/month. Annual billing saves 20%. All paid plans include a 14-day free trial with full feature access. Custom enterprise pricing is available for large organizations. No credit card required for trial.",
      keywords: [
        "pricing",
        "cost",
        "free trial",
        "plans",
        "subscription",
        "payment",
      ],
      icon: CreditCard,
      relatedPages: ["pricing", "plans"],
    },
  ];

  const categories = [
    {
      id: "all",
      name: "All Questions",
      icon: <HelpCircle className="w-4 h-4" />,
    },
    {
      id: "organizer",
      name: "For Organizers",
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: "attendee",
      name: "For Attendees",
      icon: <Ticket className="w-4 h-4" />,
    },
    {
      id: "general",
      name: "Platform & Pricing",
      icon: <Sparkles className="w-4 h-4" />,
    },
  ];

  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.keywords.some((keyword) =>
        keyword.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      text: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simple AI response logic
    setTimeout(() => {
      const botResponse = generateBotResponse(inputMessage);
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);

    setInputMessage("");
  };

  const generateBotResponse = (query: string): Message => {
    const lowerQuery = query.toLowerCase();

    // Find relevant FAQ
    const relevantFAQ = faqs.find(
      (faq) =>
        faq.keywords.some((keyword) =>
          lowerQuery.includes(keyword.toLowerCase())
        ) || lowerQuery.includes(faq.question.toLowerCase().substring(0, 20))
    );

    if (relevantFAQ) {
      return {
        id: messages.length + 2,
        type: "bot",
        text: relevantFAQ.answer,
        timestamp: new Date(),
        suggestions: [
          "Tell me more",
          "Show related topics",
          "Contact support",
          "Ask another question",
        ],
      };
    }

    // Default responses based on keywords
    if (lowerQuery.includes("create") && lowerQuery.includes("event")) {
      return {
        id: messages.length + 2,
        type: "bot",
        text: "To create an event, go to the Event Management Hub and click 'Create New Event'. You'll be guided through a step-by-step workflow. Would you like me to explain any specific part of the event creation process?",
        timestamp: new Date(),
        suggestions: ["Venue mapping", "Team assignments", "Analytics setup"],
      };
    }

    if (lowerQuery.includes("navigation") || lowerQuery.includes("navigate")) {
      return {
        id: messages.length + 2,
        type: "bot",
        text: "Our navigation system provides real-time directions with GPS tracking, crowd density indicators, and turn-by-turn guidance. You can navigate to gates, find amenities, or explore the venue map. What would you like help with?",
        timestamp: new Date(),
        suggestions: ["Gate selection", "Indoor navigation", "Emergency exits"],
      };
    }

    if (lowerQuery.includes("pricing") || lowerQuery.includes("cost")) {
      return {
        id: messages.length + 2,
        type: "bot",
        text: "DrishtiX offers flexible pricing: Free tier for small events, Professional at $99/month, and Enterprise at $299/month. All paid plans include a 14-day free trial. Would you like details about specific features in each plan?",
        timestamp: new Date(),
        suggestions: [
          "Free tier features",
          "Enterprise benefits",
          "Start free trial",
        ],
      };
    }

    // Generic response
    return {
      id: messages.length + 2,
      type: "bot",
      text: "I'd be happy to help! You can browse our FAQ section for detailed answers, or try asking about specific topics like event creation, navigation, DrishtiX AI, venue mapping, or pricing. What would you like to know more about?",
      timestamp: new Date(),
      suggestions: [
        "How to create events",
        "Safety features",
        "Attendee navigation",
        "View all FAQs",
      ],
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl">Help & Support</h2>
              <p className="text-blue-100 text-sm">FAQs & AI Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-white border-b border-slate-200 px-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("faq")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200 ${
                activeTab === "faq"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>FAQ</span>
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200 ${
                activeTab === "chat"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>AI Chat</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                Beta
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "faq" ? (
            <div className="h-full flex flex-col">
              {/* Search & Filter */}
              <div className="p-6 space-y-4 border-b border-slate-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search FAQs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${
                        selectedCategory === category.id
                          ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {category.icon}
                      <span className="text-sm">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQ List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {filteredFAQs.length > 0 ? (
                  filteredFAQs.map((faq) => {
                    const IconComponent = faq.icon;
                    return (
                      <div
                        key={faq.id}
                        className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 transition-all duration-200"
                      >
                        <button
                          onClick={() =>
                            setExpandedFAQ(
                              expandedFAQ === faq.id ? null : faq.id
                            )
                          }
                          className="w-full p-4 flex items-start gap-4 text-left"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <IconComponent className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-slate-900 mb-1">
                              {faq.question}
                            </p>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  faq.category === "organizer"
                                    ? "bg-purple-100 text-purple-700"
                                    : faq.category === "attendee"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {faq.category}
                              </span>
                            </div>
                          </div>
                          {expandedFAQ === faq.id ? (
                            <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                          )}
                        </button>
                        {expandedFAQ === faq.id && (
                          <div className="px-4 pb-4 pl-[72px] border-t border-slate-100">
                            <p className="text-slate-700 mt-4">{faq.answer}</p>
                            {faq.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-4">
                                {faq.keywords
                                  .slice(0, 5)
                                  .map((keyword, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs"
                                    >
                                      {keyword}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">
                      No FAQs found matching your search.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("all");
                      }}
                      className="mt-4 text-blue-600 hover:text-blue-700"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.type === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === "user"
                          ? "bg-blue-600"
                          : "bg-gradient-to-br from-purple-600 to-pink-600"
                      }`}
                    >
                      {message.type === "user" ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div
                      className={`flex-1 max-w-[80%] ${
                        message.type === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`p-4 rounded-xl ${
                          message.type === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-900"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                      </div>
                      {message.suggestions && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {message.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask me anything..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Powered by DrishtiX AI • Responses are generated based on our
                  knowledge base
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
