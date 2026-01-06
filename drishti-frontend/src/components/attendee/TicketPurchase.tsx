import { useState } from "react";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  CreditCard,
  Check,
  Loader,
  Shield,
  Ticket,
  AlertCircle,
} from "lucide-react";
import type { EventType } from "./AttendeeEventHub";

interface TicketPurchaseProps {
  event: EventType;
  onBack: () => void;
  onComplete: () => void;
}

export function TicketPurchase({
  event,
  onBack,
  onComplete,
}: TicketPurchaseProps) {
  const [name, setName] = useState("Akshat Kumar");
  const [email, setEmail] = useState("akshat@example.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [quantity, setQuantity] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});

  const totalAmount = event.price * quantity;

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; phone?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[\d\s+()-]{10,}$/.test(phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePurchase = () => {
    if (!validateForm()) {
      return;
    }

    setProcessing(true);

    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);

      // Store ticket in localStorage
      const existingTickets = JSON.parse(
        localStorage.getItem("eventTickets") || "[]"
      );
      const newTicket = {
        id: `ticket-${Date.now()}`,
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
        eventTime: event.time,
        venue: event.venue,
        quantity,
        totalPaid: totalAmount,
        purchaseDate: new Date().toLocaleDateString(),
        entryGate: event.bestGate,
        qrCode: `QR-${Date.now()}-${event.id}`,
        status: "active",
      };
      existingTickets.push(newTicket);
      localStorage.setItem("eventTickets", JSON.stringify(existingTickets));

      setTimeout(() => {
        onComplete();
      }, 2000);
    }, 2500);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in duration-500">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-slate-900 text-3xl mb-3">🎉 Success!</h2>
            <p className="text-slate-600 text-lg mb-2">
              {event.isFree ? "Registration" : "Ticket purchased"} successfully
            </p>
            <p className="text-slate-500 mb-6">
              Your ticket has been confirmed
            </p>

            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 mb-6 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-600">Entry Gate</span>
                <span className="text-slate-900 text-lg">{event.bestGate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Ticket Stored</span>
                <span className="text-green-600 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  In App
                </span>
              </div>
            </div>

            <p className="text-slate-600 text-sm">
              Redirecting to your tickets...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-slate-900">
                {event.isFree ? "Register for Event" : "Purchase Ticket"}
              </h1>
              <p className="text-slate-600 text-sm">{event.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8">
              <h3 className="text-slate-900 text-2xl mb-6">
                Personal Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-700 mb-2 font-medium">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name)
                          setErrors({ ...errors, name: undefined });
                      }}
                      className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        errors.name
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-slate-300 focus:border-purple-500 focus:ring-purple-200"
                      }`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {errors.name && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.name}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 mb-2 font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email)
                          setErrors({ ...errors, email: undefined });
                      }}
                      className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        errors.email
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-slate-300 focus:border-purple-500 focus:ring-purple-200"
                      }`}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  {errors.email && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.email}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 mb-2 font-medium">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone)
                          setErrors({ ...errors, phone: undefined });
                      }}
                      className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        errors.phone
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-slate-300 focus:border-purple-500 focus:ring-purple-200"
                      }`}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  {errors.phone && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ticket Quantity */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8">
              <h3 className="text-slate-900 text-2xl mb-6">Ticket Quantity</h3>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center text-slate-700 text-2xl transition-all"
                >
                  −
                </button>
                <div className="flex-1 text-center">
                  <p className="text-slate-600 text-sm">Number of Tickets</p>
                  <p className="text-slate-900 text-4xl">{quantity}</p>
                </div>
                <button
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="w-12 h-12 bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center justify-center text-white text-2xl transition-all"
                >
                  +
                </button>
              </div>
            </div>

            {/* Payment Method (Fake) */}
            {!event.isFree && (
              <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8">
                <h3 className="text-slate-900 text-2xl mb-6">Payment Method</h3>

                <div className="space-y-3">
                  <button className="w-full p-4 border-2 border-purple-500 bg-purple-50 rounded-xl flex items-center gap-3 text-left">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-900">Credit / Debit Card</p>
                      <p className="text-slate-600 text-sm">
                        Visa, Mastercard, Rupay
                      </p>
                    </div>
                    <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </button>

                  <button className="w-full p-4 border-2 border-slate-200 rounded-xl flex items-center gap-3 text-left hover:border-slate-300 transition-all">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-xl">💳</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-900">UPI</p>
                      <p className="text-slate-600 text-sm">
                        Pay using UPI apps
                      </p>
                    </div>
                  </button>

                  <button className="w-full p-4 border-2 border-slate-200 rounded-xl flex items-center gap-3 text-left hover:border-slate-300 transition-all">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 text-xl">🏦</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-900">Net Banking</p>
                      <p className="text-slate-600 text-sm">All major banks</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-6 sticky top-24">
              <h3 className="text-slate-900 text-xl mb-4">Order Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-slate-600">
                  <span>Event</span>
                  <span className="text-slate-900">{event.name}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Date</span>
                  <span className="text-slate-900">{event.date}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Time</span>
                  <span className="text-slate-900">{event.time}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tickets</span>
                  <span className="text-slate-900">× {quantity}</span>
                </div>
                {!event.isFree && (
                  <div className="flex justify-between text-slate-600">
                    <span>Price per ticket</span>
                    <span className="text-slate-900">₹{event.price}</span>
                  </div>
                )}
              </div>

              <div className="border-t-2 border-slate-200 pt-4 mb-6">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-700">Total Amount</span>
                  {event.isFree ? (
                    <span className="text-green-600 text-2xl">FREE</span>
                  ) : (
                    <span className="text-slate-900 text-3xl">
                      ₹{totalAmount}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handlePurchase}
                disabled={processing}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-lg hover:shadow-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>
                      {event.isFree
                        ? "Complete Registration"
                        : "Proceed to Pay"}
                    </span>
                  </>
                )}
              </button>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <Shield className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p>Secure payment • Your data is encrypted and protected</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
