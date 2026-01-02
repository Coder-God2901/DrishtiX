import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  Shield,
  TrendingUp,
  AlertTriangle,
  Zap,
  Star,
  DoorOpen,
  Timer,
} from "lucide-react";
import type { EventType } from "./AttendeeEventHub";

interface EventDetailProps {
  event: EventType;
  onBack: () => void;
  onRegister: () => void;
}

export function EventDetail({ event, onBack, onRegister }: EventDetailProps) {
  const getCrowdLabel = (status: string) => {
    switch (status) {
      case "calm":
        return {
          label: "Low Crowd",
          color: "from-green-500 to-emerald-600",
          icon: "🟢",
        };
      case "busy":
        return {
          label: "Moderate Crowd",
          color: "from-yellow-500 to-orange-600",
          icon: "🟡",
        };
      case "crowded":
        return {
          label: "High Crowd",
          color: "from-red-500 to-rose-600",
          icon: "🔴",
        };
      default:
        return {
          label: "Unknown",
          color: "from-gray-500 to-gray-600",
          icon: "⚪",
        };
    }
  };

  const crowdInfo = getCrowdLabel(event.crowdStatus);
  const safetyColor =
    event.safetyScore >= 85
      ? "green"
      : event.safetyScore >= 70
      ? "yellow"
      : "red";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-slate-900">{event.name}</h1>
              <p className="text-slate-600 text-sm">{event.category} Event</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Hero Image */}
        <div className="relative h-96 rounded-2xl overflow-hidden mb-8 shadow-2xl">
          <img
            src={event.image}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <h2 className="text-white text-4xl mb-2">{event.name}</h2>
            <div className="flex items-center gap-4 text-white">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{event.venue}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{event.time}</span>
              </div>
            </div>
          </div>
          {event.isFree && (
            <div className="absolute top-6 right-6 bg-green-500 text-white px-4 py-2 rounded-xl text-lg shadow-xl">
              FREE EVENT
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Overview */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8">
              <h3 className="text-slate-900 text-2xl mb-4">Event Overview</h3>
              <p className="text-slate-700 leading-relaxed mb-6">
                {event.description}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <Users className="w-6 h-6 text-purple-600 mb-2" />
                  <p className="text-slate-600 text-sm">Expected Attendance</p>
                  <p className="text-slate-900 text-xl">
                    {event.expectedAttendance.toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <Star className="w-6 h-6 text-yellow-500 mb-2" />
                  <p className="text-slate-600 text-sm">Average Rating</p>
                  <p className="text-slate-900 text-xl">
                    {event.averageRating} / 5.0
                  </p>
                </div>
              </div>
            </div>

            {/* Real-Time Safety Info */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-7 h-7" />
                <h3 className="text-2xl">Real-Time Event Info</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Safety Status */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5" />
                    <span className="text-sm opacity-90">Safety Status</span>
                  </div>
                  <div
                    className={`text-3xl mb-1 ${
                      safetyColor === "green"
                        ? "text-green-300"
                        : safetyColor === "yellow"
                        ? "text-yellow-300"
                        : "text-red-300"
                    }`}
                  >
                    {event.safetyScore}%
                  </div>
                  <p className="text-sm opacity-75">
                    {event.safetyScore >= 85
                      ? "Excellent"
                      : event.safetyScore >= 70
                      ? "Good"
                      : "Moderate"}
                  </p>
                </div>

                {/* Crowd Heat */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm opacity-90">Crowd Level</span>
                  </div>
                  <div className="text-3xl mb-1">{crowdInfo.icon}</div>
                  <p className="text-sm opacity-75">{crowdInfo.label}</p>
                </div>

                {/* Queue Time */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Timer className="w-5 h-5" />
                    <span className="text-sm opacity-90">Predicted Queue</span>
                  </div>
                  <div className="text-3xl mb-1">~{event.queueTime}</div>
                  <p className="text-sm opacity-75">minutes</p>
                </div>

                {/* Best Entry Gate */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <DoorOpen className="w-5 h-5" />
                    <span className="text-sm opacity-90">Best Entry Gate</span>
                  </div>
                  <div className="text-2xl mb-1">{event.bestGate}</div>
                  <p className="text-sm opacity-75">Fastest entry</p>
                </div>
              </div>

              <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm">
                      <strong>DrishtiX Insight:</strong> Arrive 20 minutes early
                      for smooth entry.
                      {event.bestGate} has the shortest wait time currently.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Venue Map Preview */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8">
              <h3 className="text-slate-900 text-2xl mb-4">Venue Location</h3>
              <div className="bg-gradient-to-br from-slate-100 to-blue-50 rounded-xl h-64 flex items-center justify-center border-2 border-slate-200">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                  <p className="text-slate-900 text-lg mb-1">{event.venue}</p>
                  <p className="text-slate-600">{event.location}</p>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-slate-900 text-2xl">Reviews & Ratings</h3>
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  <span className="text-slate-900 text-2xl">
                    {event.averageRating}
                  </span>
                  <span className="text-slate-600">/ 5.0</span>
                </div>
              </div>

              {/* Rating Breakdown */}
              {event.reviews.length > 0 && (
                <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-slate-600 text-xs mb-1">Safety</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-green-500 fill-green-500" />
                        <span className="text-slate-900 text-sm">
                          {(
                            event.reviews.reduce(
                              (acc, r) => acc + r.safetyRating,
                              0
                            ) / event.reviews.length
                          ).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-600 text-xs mb-1">Crowd</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-blue-500 fill-blue-500" />
                        <span className="text-slate-900 text-sm">
                          {(
                            event.reviews.reduce(
                              (acc, r) => acc + r.crowdComfort,
                              0
                            ) / event.reviews.length
                          ).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-600 text-xs mb-1">Cleanliness</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-purple-500 fill-purple-500" />
                        <span className="text-slate-900 text-sm">
                          {(
                            event.reviews.reduce(
                              (acc, r) => acc + r.cleanliness,
                              0
                            ) / event.reviews.length
                          ).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-600 text-xs">
                    {event.reviews.length} verified reviews
                  </p>
                </div>
              )}

              {event.reviews.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">
                    No reviews yet. Be the first to review!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {event.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-t border-slate-200 pt-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-slate-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-slate-900">
                          {review.userName}
                        </span>
                        <span className="text-slate-500 text-sm">
                          • {review.date}
                        </span>
                      </div>
                      <p className="text-slate-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Venue Stats */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8">
              <h3 className="text-slate-900 text-2xl mb-6">
                Live Venue Insights
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-700">Parking Availability</span>
                    <span className="text-green-600 font-medium">Good</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="h-2 bg-green-500 rounded-full"
                      style={{ width: "68%" }}
                    />
                  </div>
                  <p className="text-slate-600 text-xs mt-2">
                    136/200 spots available • Lot B recommended
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-700">Food Court Status</span>
                    <span className="text-blue-600 font-medium">Moderate</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: "45%" }}
                    />
                  </div>
                  <p className="text-slate-600 text-xs mt-2">
                    8 vendors open • Average wait: 12 mins
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-700">Restroom Queue</span>
                    <span className="text-green-600 font-medium">Low</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="h-2 bg-green-500 rounded-full"
                      style={{ width: "25%" }}
                    />
                  </div>
                  <p className="text-slate-600 text-xs mt-2">
                    Section A & C: ~2 min wait • Section B: ~5 min wait
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-700">Medical Support</span>
                    <span className="text-green-600 font-medium">Ready</span>
                  </div>
                  <p className="text-slate-600 text-xs">
                    3 first aid stations • 2 ambulances on standby
                  </p>
                </div>
              </div>
            </div>

            {/* Food & Vendors */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8">
              <h3 className="text-slate-900 text-2xl mb-6">Food & Vendors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    name: "Street Tacos",
                    category: "Mexican",
                    wait: "8 min",
                    rating: 4.5,
                    price: "₹₹",
                  },
                  {
                    name: "Pizza Palace",
                    category: "Italian",
                    wait: "12 min",
                    rating: 4.3,
                    price: "₹₹₹",
                  },
                  {
                    name: "Chai & Snacks",
                    category: "Indian",
                    wait: "5 min",
                    rating: 4.7,
                    price: "₹",
                  },
                  {
                    name: "Burger Station",
                    category: "American",
                    wait: "10 min",
                    rating: 4.2,
                    price: "₹₹",
                  },
                  {
                    name: "Fresh Juice Bar",
                    category: "Beverages",
                    wait: "3 min",
                    rating: 4.6,
                    price: "₹",
                  },
                  {
                    name: "Sushi Corner",
                    category: "Japanese",
                    wait: "15 min",
                    rating: 4.4,
                    price: "₹₹₹",
                  },
                ].map((vendor, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-slate-900 font-medium">
                          {vendor.name}
                        </p>
                        <p className="text-slate-600 text-sm">
                          {vendor.category}
                        </p>
                      </div>
                      <span className="text-slate-600 text-sm">
                        {vendor.price}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-slate-700">{vendor.rating}</span>
                      </div>
                      <span className="text-slate-600">
                        Wait: {vendor.wait}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sponsors & Partners */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border-2 border-slate-200 p-8">
              <h3 className="text-slate-900 text-2xl mb-6">Event Partners</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: "TechCorp", logo: "🏢" },
                  { name: "Spotify", logo: "🎵" },
                  { name: "Red Bull", logo: "⚡" },
                  { name: "Nike", logo: "✓" },
                  { name: "Coca-Cola", logo: "🥤" },
                  { name: "Samsung", logo: "📱" },
                  { name: "Airtel", logo: "📡" },
                  { name: "Zomato", logo: "🍔" },
                ].map((sponsor, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-4 flex flex-col items-center justify-center border border-slate-200 hover:shadow-md transition-all"
                  >
                    <div className="text-3xl mb-2">{sponsor.logo}</div>
                    <p className="text-slate-700 text-sm text-center">
                      {sponsor.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Registration Card */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-6 sticky top-24">
              <div className="mb-6">
                <p className="text-slate-600 text-sm mb-2">Ticket Price</p>
                {event.isFree ? (
                  <p className="text-green-600 text-3xl">Free Entry</p>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-900 text-4xl">
                      ₹{event.price}
                    </span>
                    <span className="text-slate-600">/ person</span>
                  </div>
                )}
              </div>

              <button
                onClick={onRegister}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-lg hover:shadow-xl hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 mb-4"
              >
                <Shield className="w-5 h-5" />
                {event.isFree ? "Register Now" : "Buy Ticket"}
              </button>

              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Instant confirmation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Mobile ticket</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Free cancellation</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-slate-700 mb-2">Hosted by</p>
                <p className="text-slate-900">{event.hostName}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
