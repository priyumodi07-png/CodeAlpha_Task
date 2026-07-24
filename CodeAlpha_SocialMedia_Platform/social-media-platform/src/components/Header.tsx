import React, { useState } from "react";
import { User, Stats } from "../types";
import { Users, Sparkles, MessageCircle, Heart, FileText, UserPlus, HelpCircle, Search, X, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  currentUser: User | null;
  users: User[];
  onUserSelect: (user: User) => void;
  onOpenCreateUser: () => void;
  onOpenSearchModal: (query?: string) => void;
  stats: Stats | null;
}

export default function Header({
  currentUser,
  users,
  onUserSelect,
  onOpenCreateUser,
  onOpenSearchModal,
  stats
}: HeaderProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const [showQuickDropdown, setShowQuickDropdown] = useState(false);

  const matchingQuickUsers = headerSearch.trim()
    ? users.filter(u =>
        u.displayName.toLowerCase().includes(headerSearch.toLowerCase()) ||
        u.username.toLowerCase().includes(headerSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenSearchModal(headerSearch);
    setShowQuickDropdown(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 md:px-6 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
        {/* Logo and App Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-white fill-white/20 animate-pulse" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-xl tracking-tight text-slate-900 leading-none">
                VERVE
              </h1>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mt-0.5">
                NEXUS SOCIAL NETWORK
              </span>
            </div>
          </div>

          {/* Quick Help on Switcher */}
          <button
            onClick={() => setShowTooltip(!showTooltip)}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors"
            title="How this switcher works"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar for Account Name with SEARCH BUTTON */}
        <div className="relative flex-1 max-w-md my-1 md:my-0">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="header-account-search-input"
                placeholder="Search accounts by name or @handle..."
                value={headerSearch}
                onChange={(e) => {
                  setHeaderSearch(e.target.value);
                  setShowQuickDropdown(true);
                }}
                onFocus={() => setShowQuickDropdown(true)}
                className="w-full pl-8.5 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
              />
              {headerSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setHeaderSearch("");
                    setShowQuickDropdown(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="submit"
              id="header-search-account-btn"
              className="bg-slate-800 hover:bg-slate-900 text-white rounded-lg py-1.5 px-3 text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer shrink-0"
              title="Search Accounts"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Search</span>
            </button>
          </form>

          {/* Quick Dropdown Auto-Complete for Account Search */}
          {showQuickDropdown && headerSearch.trim() && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 space-y-1 overflow-hidden animate-in fade-in duration-150">
              <div className="px-2.5 py-1 flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-100">
                <span>Matching Accounts ({matchingQuickUsers.length})</span>
                <button
                  type="button"
                  onClick={() => setShowQuickDropdown(false)}
                  className="hover:text-slate-600"
                >
                  Close
                </button>
              </div>

              {matchingQuickUsers.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  No accounts found. Click <strong>Search</strong> for directory view.
                </div>
              ) : (
                matchingQuickUsers.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      onUserSelect(u);
                      setShowQuickDropdown(false);
                      setHeaderSearch("");
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <img
                      src={u.avatar}
                      alt={u.displayName}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                        {u.displayName}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 truncate">
                        @{u.username}
                      </p>
                    </div>
                  </button>
                ))
              )}

              <button
                type="button"
                onClick={() => {
                  onOpenSearchModal(headerSearch);
                  setShowQuickDropdown(false);
                }}
                className="w-full text-center py-2 text-xs font-bold text-blue-600 bg-blue-50/60 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer mt-1"
              >
                View full directory for "{headerSearch}" →
              </button>
            </div>
          )}
        </div>

        {/* Global Stats Counter */}
        {stats && (
          <div className="hidden xl:flex items-center gap-3 text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-blue-600" />
              <span>{stats.usersCount} users</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-blue-600" />
              <span>{stats.postsCount} posts</span>
            </div>
          </div>
        )}

        {/* Active Logged-in Account Badge */}
        <div className="flex items-center gap-2 self-end md:self-auto w-full md:w-auto justify-end">
          {currentUser && (
            <button
              onClick={() => onUserSelect(currentUser)}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 transition-all cursor-pointer shadow-2xs group"
              title="View your account profile"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.displayName}
                className="w-6 h-6 rounded-full object-cover ring-2 ring-blue-500/20 group-hover:ring-blue-500 transition-all"
                referrerPolicy="no-referrer"
              />
              <div className="text-left leading-tight hidden xs:block">
                <span className="block text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {currentUser.displayName}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  @{currentUser.username}
                </span>
              </div>
            </button>
          )}

          <button
            id="register-profile-btn"
            onClick={onOpenCreateUser}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2 px-3 text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
            title="Create a new account on Verve"
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden xs:inline">New Account</span>
          </button>

          <button
            onClick={() => setShowTooltip(!showTooltip)}
            className="hidden md:inline-flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors cursor-pointer"
            title="Explain Simulation Switcher"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Simulator guide drop banner */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="max-w-7xl mx-auto mt-2.5 p-3.5 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-800 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-600 fill-blue-600/20 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold tracking-wide uppercase text-[10px] text-blue-700">NEW: INTERACTIVE SIMULATOR MODE ENABLED</p>
                <p className="leading-relaxed">
                  This application simulates a live social network. Since there are multiple users registered, you can <strong>switch your active profile</strong> using the dropdown above at any time. When you post, comment, like, or follow, the database registers those actions under the active profile's identity! Switch accounts to comment on your own posts, follow other users, and test the real-time social metrics!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
