import React, { useState, useEffect } from "react";
import { User, ShoppingBag, MapPin, Phone, Mail, Calendar, Check, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { UserProfile, Order } from "../types";
import { formatPrice } from "../utils/format";

interface ProfileProps {
  userProfile: UserProfile | null;
  orders: Order[];
  onSaveProfile: (profile: Omit<UserProfile, "id">) => Promise<void>;
  onGoShopping: () => void;
}

export default function Profile({ userProfile, orders, onSaveProfile, onGoShopping }: ProfileProps) {
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName || "");
      setAddress(userProfile.address || "");
      setPhone(userProfile.phone || "");
      setEmail(userProfile.email || "");
    }
  }, [userProfile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveProfile({
        fullName,
        email,
        address,
        phone,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleOrder = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Processing":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Shipped":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in text-slate-900" id="profile-panel">
      <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-slate-900 mb-8">
        Customer Account Dashboard
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Profile Information */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-display font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
            <User className="h-4.5 w-4.5 text-slate-400" />
            <span>Profile Details</span>
          </h2>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address (Read-Only)
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-400 text-sm rounded-xl pl-10 pr-4 py-2.5 cursor-not-allowed"
                />
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="E.g. Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all"
                />
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Default Shipping Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Street Address, City, State, ZIP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all"
                />
                <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Contact Phone
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all"
                />
                <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Success state info */}
            {saveSuccess && (
              <p className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-xl">
                <Check className="h-4 w-4" />
                <span>Account profile details saved!</span>
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full h-11 bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 rounded-full font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 mt-6 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <span>Save Profile Details</span>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Order History */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-display font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
            <ShoppingBag className="h-4.5 w-4.5 text-slate-400" />
            <span>Order History</span>
          </h2>

          {orders.length === 0 ? (
            <div className="p-8 border border-slate-200 bg-slate-50 rounded-2xl text-center">
              <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900">No Orders Found</h3>
              <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
                You haven't placed any orders with this profile yet.
              </p>
              <button
                onClick={onGoShopping}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
              >
                Start Exploring Shop
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <div
                    key={order.id}
                    className="border border-slate-200 rounded-2xl overflow-hidden"
                  >
                    {/* Collapsed view header */}
                    <div
                      onClick={() => toggleOrder(order.id)}
                      className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/50 cursor-pointer transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-mono text-slate-500">ID: {order.id.substring(0, 10)}...</p>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formattedDate}</span>
                          <span>•</span>
                          <span>{order.items.length} items</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getStatusStyle(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="text-sm font-bold text-emerald-800 font-sans">{formatPrice(order.totalAmount)}</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded details container */}
                    {isExpanded && (
                      <div className="p-4 border-t border-slate-200 space-y-4 bg-white text-xs leading-relaxed">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Shipping Destination
                          </span>
                          <p className="font-bold text-slate-850">{order.customerName}</p>
                          <p className="text-slate-500">{order.shippingAddress}</p>
                        </div>

                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                            Product List Breakdown
                          </span>
                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div
                                key={item.productId}
                                className="flex items-center justify-between text-xs font-semibold text-slate-700 border-b border-dashed border-slate-100 pb-1.5 last:border-0 last:pb-0"
                              >
                                <span>
                                  {item.name} <span className="text-slate-400">x{item.quantity}</span>
                                </span>
                                <span className="font-bold text-emerald-800 font-sans">
                                  {formatPrice(item.price * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
