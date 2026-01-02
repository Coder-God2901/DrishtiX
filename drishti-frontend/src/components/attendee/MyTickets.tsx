import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Ticket,
  QrCode,
  MapPin,
  Calendar,
  Clock,
  DoorOpen,
  Star,
  Check,
  X,
  Edit,
  Trash2,
  Download,
  Share2,
  AlertCircle,
  Users,
  RefreshCw,
  CheckCircle,
  XCircle,
  Radio,
  MoreVertical,
  Eye,
  Printer,
} from "lucide-react";
import { ticketService, Ticket as BackendTicket } from "../../services/ticket.service";
import { wsService } from "../../services/websocket.service";

interface MyTicketsProps {
  onBack: () => void;
  userId?: string;
  eventId?: string;
}

export function MyTickets({ onBack, userId = 'default-user-id', eventId }: MyTicketsProps) {
  const [tickets, setTickets] = useState<BackendTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<BackendTicket | null>(
    null
  );
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Review states
  const [rating, setRating] = useState(0);
  const [safetyRating, setSafetyRating] = useState(0);
  const [crowdComfort, setCrowdComfort] = useState(0);
  const [cleanliness, setCleanliness] = useState(0);
  const [reviewText, setReviewText] = useState("");

  // Edit states
  const [editAttendeeNames, setEditAttendeeNames] = useState<string[]>([]);
  const [editSpecialRequirements, setEditSpecialRequirements] = useState<
    string[]
  >([]);

  // Filter states
  const [filterStatus, setFilterStatus] = useState<
    "all" | "ACTIVE" | "USED" | "EXPIRED" | "CANCELLED" | "REFUNDED"
  >("all");
  const [sortBy, setSortBy] = useState<"date" | "price" | "name">("date");
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalSpent: 0,
    favoriteCategory: "Music",
    memberSince: "Jan 2024",
    reviewsWritten: 0,
    averageRating: 0,
  });

  // Load tickets and subscribe to updates
  useEffect(() => {
    console.log("🎫 MyTickets: Loading tickets from backend");
    setIsLiveConnected(true);
    loadTickets();

    // Subscribe to real-time ticket updates
    const handleTicketUpdate = (ticket: BackendTicket) => {
      console.log("🎫 Ticket update received:", ticket);
      loadTickets(); // Reload all tickets when one changes
    };

    wsService.on('ticket:updated', handleTicketUpdate);
    wsService.on('ticket:purchased', handleTicketUpdate);
    wsService.emit('subscribe:tickets', userId);

    return () => {
      wsService.off('ticket:updated', handleTicketUpdate);
      wsService.off('ticket:purchased', handleTicketUpdate);
      setIsLiveConnected(false);
    };
  }, [userId]);

  // Recalculate stats when tickets change
  useEffect(() => {
    const activeTickets = tickets.filter((t) => t.status === "ACTIVE");
    const totalSpent = tickets.reduce((sum, t) => sum + t.totalPaid, 0);

    setStats({
      totalEvents: tickets.length,
      upcomingEvents: activeTickets.length,
      totalSpent,
      favoriteCategory: "Music",
      memberSince: "Jan 2024",
      reviewsWritten: tickets.filter((t) => t.status === "USED").length,
      averageRating: 4.6,
    });
  }, [tickets]);

  const loadTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ticketService.getUserTickets(userId, eventId ? { eventId } : undefined);
      if (response.success && response.data) {
        setTickets(response.data);
        console.log(`✅ Loaded ${response.data.length} tickets`);
      } else {
        setError(response.error || 'Failed to load tickets');
        console.error('❌ Failed to load tickets:', response.error);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('❌ Error loading tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTickets = tickets
    .filter(
      (ticket) => filterStatus === "all" || ticket.status === filterStatus
    )
    .sort((a, b) => {
      if (sortBy === "date") {
        return (
          new Date(b.purchaseDate).getTime() -
          new Date(a.purchaseDate).getTime()
        );
      } else if (sortBy === "price") {
        return b.totalPaid - a.totalPaid;
      } else {
        return a.eventName.localeCompare(b.eventName);
      }
    });

  // CRUD Operations
  const handleCancelTicket = async () => {
    if (!selectedTicket) return;

    setIsLoading(true);
    try {
      const reason = prompt('Please provide a reason for cancellation (optional):');
      const response = await ticketService.cancelTicket(selectedTicket.id, reason || undefined);
      
      if (response.success) {
        await loadTickets();
        setShowCancelModal(false);
        setSelectedTicket(null);
        console.log('✅ Ticket cancelled successfully');
      } else {
        alert(response.error || 'Failed to cancel ticket');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefundTicket = async () => {
    if (!selectedTicket) return;

    setIsLoading(true);
    try {
      const reason = prompt('Please provide a reason for refund (optional):');
      const response = await ticketService.refundTicket(selectedTicket.id, reason || undefined);
      
      if (response.success) {
        await loadTickets();
        setShowCancelModal(false);
        setSelectedTicket(null);
        console.log('✅ Ticket refunded successfully');
      } else {
        alert(response.error || 'Failed to refund ticket');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;

    // Validate attendee names
    const validNames = editAttendeeNames.filter((n) => n.trim() !== "");
    if (validNames.length === 0) {
      alert("Please enter at least one attendee name");
      return;
    }

    setIsLoading(true);
    try {
      const response = await ticketService.updateTicket(selectedTicket.id, {
        holderName: validNames[0], // First name as primary holder
        additionalInfo: {
          attendeeNames: validNames,
          specialRequirements: editSpecialRequirements.filter(
            (r) => r.trim() !== ""
          ),
        }
      });

      if (response.success) {
        await loadTickets();
        setShowEditModal(false);
        setSelectedTicket(null);
        console.log('✅ Ticket updated successfully');
      } else {
        alert(response.error || 'Failed to update ticket');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = () => {
    // Here you could integrate with a reviews system
    console.log("Review submitted:", {
      ticketId: selectedTicket?.id,
      rating,
      safetyRating,
      crowdComfort,
      cleanliness,
      reviewText,
    });

    setShowReviewModal(false);
    setSelectedTicket(null);
    resetReviewForm();
  };

  const resetReviewForm = () => {
    setRating(0);
    setSafetyRating(0);
    setCrowdComfort(0);
    setCleanliness(0);
    setReviewText("");
  };

  const openEditModal = (ticket: BackendTicket) => {
    setSelectedTicket(ticket);
    setEditAttendeeNames(ticket.attendeeNames || [""]);
    setEditSpecialRequirements(ticket.specialRequirements || []);
    setShowEditModal(true);
  };

  const getStatusColor = (status: BackendTicket["status"]) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "USED":
        return "bg-slate-100 text-slate-700";
      case "EXPIRED":
        return "bg-red-100 text-red-700";
      case "CANCELLED":
        return "bg-orange-100 text-orange-700";
      case "REFUNDED":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusIcon = (status: BackendTicket["status"]) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle className="w-4 h-4" />;
      case "USED":
        return <Check className="w-4 h-4" />;
      case "EXPIRED":
        return <XCircle className="w-4 h-4" />;
      case "CANCELLED":
        return <X className="w-4 h-4" />;
      case "REFUNDED":
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const StarRating = ({
    value,
    onChange,
    label,
  }: {
    value: number;
    onChange: (val: number) => void;
    label: string;
  }) => (
    <div className="mb-4">
      <label className="block text-slate-700 mb-2">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= value
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-slate-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

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
              <h1 className="text-slate-900 flex items-center gap-2">
                <Ticket className="w-6 h-6 text-purple-600" />
                My Tickets
                {isLiveConnected && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" />
                    Live
                  </span>
                )}
              </h1>
              <p className="text-slate-600 text-sm">
                Manage your event tickets and registrations
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* User Stats Dashboard */}
        <div className="mb-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
          <div className="mb-6">
            <h2 className="text-2xl mb-2">Your Event Journey</h2>
            <p className="text-purple-100">Member since {stats.memberSince}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all">
              <p className="text-purple-100 text-sm mb-1">Total Events</p>
              <p className="text-3xl font-bold">{stats.totalEvents}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all">
              <p className="text-purple-100 text-sm mb-1">Upcoming</p>
              <p className="text-3xl font-bold">{stats.upcomingEvents}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all">
              <p className="text-purple-100 text-sm mb-1">Total Spent</p>
              <p className="text-3xl font-bold">
                ₹{stats.totalSpent.toLocaleString()}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all">
              <p className="text-purple-100 text-sm mb-1">Avg Rating</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold">{stats.averageRating}</p>
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-700 text-sm font-medium">
                Filter:
              </span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Tickets</option>
                <option value="active">Active</option>
                <option value="used">Used</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-700 text-sm font-medium">
                Sort by:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="date">Purchase Date</option>
                <option value="price">Price</option>
                <option value="name">Event Name</option>
              </select>
            </div>
            <div className="ml-auto text-slate-600 text-sm">
              {filteredTickets.length} ticket
              {filteredTickets.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Tickets Grid */}
        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-16 text-center">
            <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-slate-900 text-2xl mb-2">No tickets found</h3>
            <p className="text-slate-600 mb-6">
              {filterStatus === "all"
                ? "Browse events and register to see your tickets here"
                : `No ${filterStatus} tickets found`}
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all group"
              >
                {/* Ticket Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">
                        {ticket.eventName}
                      </h3>
                      <p className="text-purple-100 text-sm">{ticket.venue}</p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {getStatusIcon(ticket.status)}
                      {ticket.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{ticket.eventDate}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{ticket.eventTime}</span>
                    </div>
                  </div>
                </div>

                {/* Ticket Details */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">
                        Quantity: {ticket.quantity}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">Total Paid</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {ticket.totalPaid === 0
                          ? "FREE"
                          : `₹${ticket.totalPaid}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <DoorOpen className="w-4 h-4" />
                    <span className="text-sm">Entry: {ticket.entryGate}</span>
                  </div>

                  {ticket.seatSection && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-600 mb-1">Seats</p>
                      <p className="text-sm font-medium text-slate-900">
                        {ticket.seatSection} - {ticket.seatNumbers?.join(", ")}
                      </p>
                    </div>
                  )}

                  {ticket.attendeeNames && ticket.attendeeNames.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-600 mb-1">Attendees</p>
                      <p className="text-sm font-medium text-slate-900">
                        {ticket.attendeeNames.join(", ")}
                      </p>
                    </div>
                  )}

                  {ticket.specialRequirements &&
                    ticket.specialRequirements.length > 0 && (
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-xs text-amber-600 mb-1">
                          Special Requirements
                        </p>
                        <p className="text-sm font-medium text-slate-900">
                          {ticket.specialRequirements.join(", ")}
                        </p>
                      </div>
                    )}

                  {/* QR Code Display */}
                  {ticket.status === "ACTIVE" && (
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 text-center border-2 border-dashed border-slate-300">
                      <QrCode className="w-16 h-16 mx-auto mb-2 text-slate-700" />
                      <p className="text-xs text-slate-600 mb-1">QR Code</p>
                      <p className="text-sm font-mono font-bold text-slate-900">
                        {ticket.qrCode}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-slate-200">
                    {ticket.status === "ACTIVE" && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowDetailsModal(true);
                          }}
                          className="flex-1 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => openEditModal(ticket)}
                          className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all flex items-center justify-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowCancelModal(true);
                          }}
                          className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </>
                    )}
                    {ticket.status === "USED" && (
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowReviewModal(true);
                        }}
                        className="flex-1 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-all flex items-center justify-center gap-2"
                      >
                        <Star className="w-4 h-4" />
                        Write Review
                      </button>
                    )}
                    {(ticket.status === "CANCELLED" ||
                      ticket.status === "REFUNDED") && (
                      <div className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-center text-sm">
                        No actions available
                      </div>
                    )}
                  </div>
                </div>

                {/* Purchase Info Footer */}
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-200">
                  <p className="text-xs text-slate-600">
                    Purchased on {typeof ticket.purchaseDate === 'string' ? ticket.purchaseDate : new Date(ticket.purchaseDate).toLocaleDateString()} • ID: {ticket.id}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Review Modal */}
      {showReviewModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl text-slate-900">Write a Review</h2>
              <p className="text-slate-600 mt-1">{selectedTicket.eventName}</p>
            </div>
            <div className="p-6 space-y-6">
              <StarRating
                value={rating}
                onChange={setRating}
                label="Overall Experience"
              />
              <StarRating
                value={safetyRating}
                onChange={setSafetyRating}
                label="Safety & Security"
              />
              <StarRating
                value={crowdComfort}
                onChange={setCrowdComfort}
                label="Crowd Comfort"
              />
              <StarRating
                value={cleanliness}
                onChange={setCleanliness}
                label="Cleanliness"
              />
              <div>
                <label className="block text-slate-700 mb-2">Your Review</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  resetReviewForm();
                }}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={rating === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl text-slate-900">Edit Ticket Details</h2>
              <p className="text-slate-600 mt-1">{selectedTicket.eventName}</p>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-slate-700 mb-2">
                  Attendee Names
                </label>
                {editAttendeeNames.map((name, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        const newNames = [...editAttendeeNames];
                        newNames[index] = e.target.value;
                        setEditAttendeeNames(newNames);
                      }}
                      placeholder={`Attendee ${index + 1}`}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {editAttendeeNames.length > 1 && (
                      <button
                        onClick={() =>
                          setEditAttendeeNames(
                            editAttendeeNames.filter((_, i) => i !== index)
                          )
                        }
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {editAttendeeNames.length < selectedTicket.quantity && (
                  <button
                    onClick={() =>
                      setEditAttendeeNames([...editAttendeeNames, ""])
                    }
                    className="text-purple-600 hover:text-purple-700 text-sm"
                  >
                    + Add Attendee
                  </button>
                )}
              </div>

              <div>
                <label className="block text-slate-700 mb-2">
                  Special Requirements
                </label>
                {editSpecialRequirements.map((req, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => {
                        const newReqs = [...editSpecialRequirements];
                        newReqs[index] = e.target.value;
                        setEditSpecialRequirements(newReqs);
                      }}
                      placeholder="E.g., Wheelchair access, dietary restrictions"
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      onClick={() =>
                        setEditSpecialRequirements(
                          editSpecialRequirements.filter((_, i) => i !== index)
                        )
                      }
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setEditSpecialRequirements([...editSpecialRequirements, ""])
                  }
                  className="text-purple-600 hover:text-purple-700 text-sm"
                >
                  + Add Requirement
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTicket}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel/Refund Modal */}
      {showCancelModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-slate-200">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-2xl text-slate-900 text-center">
                Cancel Ticket?
              </h2>
              <p className="text-slate-600 mt-2 text-center">
                {selectedTicket.eventName}
              </p>
            </div>
            <div className="p-6">
              <p className="text-slate-700 mb-4">
                Are you sure you want to cancel this ticket? This action cannot
                be undone.
              </p>
              {selectedTicket.totalPaid > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900 mb-2">
                    <strong>Refund Information:</strong>
                  </p>
                  <p className="text-sm text-blue-700">
                    Amount: ₹{selectedTicket.totalPaid}
                    <br />
                    Refund will be processed within 5-7 business days
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all"
              >
                Keep Ticket
              </button>
              {selectedTicket.totalPaid > 0 ? (
                <button
                  onClick={handleRefundTicket}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Cancel & Refund
                </button>
              ) : (
                <button
                  onClick={handleCancelTicket}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Cancel Ticket
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
