import React, { useState, useEffect } from "react";
import { User } from "../types";
import { api } from "../api";
import { Search, X, UserCheck, UserPlus, Sparkles, RefreshCw, ArrowRight, Check } from "lucide-react";

interface AccountSearchModalProps {
  initialQuery?: string;
  currentUser: User | null;
  users: User[];
  onClose: () => void;
  onUserSelected: (user: User) => void;
  onUserSwitch: (user: User) => void;
  onFollowToggle?: () => void;
}

export default function AccountSearchModal({
  initialQuery = "",
  currentUser,
  users,
  onClose,
  onUserSelected,
  onUserSwitch,
  onFollowToggle
}: AccountSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<User[]>(users);
  const [loading, setLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    handleSearch();
  }, [searchQuery]);

  useEffect(() => {
    if (currentUser) {
      loadCurrentUserFollowing();
    }
  }, [currentUser]);

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [simulatingUserId, setSimulatingUserId] = useState<string | null>(null);

  const loadCurrentUserFollowing = async () => {
    if (!currentUser) return;
    try {
      const p = await api.getUser(currentUser.id);
      const map: Record<string, boolean> = {};
      p.following.forEach(id => {
        map[id] = true;
      });
      setFollowingMap(map);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateUserAction = async (targetUser: User, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    setSimulatingUserId(targetUser.id);
    setActionMessage(null);
    try {
      const res = await api.simulateCommunityEngage(currentUser.id, undefined, targetUser.id);
      setActionMessage(`✨ @${targetUser.username} followed your profile, liked your latest post, and posted a comment!`);
      if (onFollowToggle) onFollowToggle();
      loadCurrentUserFollowing();
    } catch (err: any) {
      console.error(err);
      setActionMessage("Failed to simulate action.");
    } finally {
      setSimulatingUserId(null);
    }
  };

  const handleSearch = async () => {
    const queryTerm = searchQuery.trim().toLowerCase();
    if (!queryTerm) {
      setResults(users);
      return;
    }

    setLoading(true);
    try {
      const filtered = await api.searchUsers(queryTerm);
      setResults(filtered);
    } catch (err) {
      // Fallback local filter
      const localFiltered = users.filter(u =>
        u.displayName.toLowerCase().includes(queryTerm) ||
        u.username.toLowerCase().includes(queryTerm) ||
        (u.bio && u.bio.toLowerCase().includes(queryTerm))
      );
      setResults(localFiltered);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;

    const isCurrentlyFollowing = followingMap[targetId];
    setFollowingMap(prev => ({ ...prev, [targetId]: !isCurrentlyFollowing }));

    try {
      await api.toggleFollow(targetId, currentUser.id);
      if (onFollowToggle) onFollowToggle();
    } catch (err) {
      console.error(err);
      setFollowingMap(prev => ({ ...prev, [targetId]: isCurrentlyFollowing }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-slate-900 text-base leading-snug">
                Search & Discover Accounts
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                Find creators, developers, and connections by name or @username
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar with explicit SEARCH BUTTON */}
        <div className="p-4 bg-white border-b border-slate-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search account name, @handle, or bio keywords..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </form>
        </div>

        {/* Notification Toast Message */}
        {actionMessage && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionMessage}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-emerald-500 hover:text-emerald-700 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400 font-mono text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span>Searching accounts...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-display font-semibold text-sm text-slate-700">No accounts match "{searchQuery}"</p>
              <p className="text-xs text-slate-400 font-mono">Try searching with a different name or handle.</p>
            </div>
          ) : (
            results.map((u) => {
              const isSelf = currentUser?.id === u.id;
              const isFollowing = followingMap[u.id] || false;

              return (
                <div
                  key={u.id}
                  onClick={() => {
                    onUserSelected(u);
                    onClose();
                  }}
                  className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-200 rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={u.avatar}
                      alt={u.displayName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-blue-500 transition-all shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display font-bold text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {u.displayName}
                        </h4>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200/60">
                          @{u.username}
                        </span>
                        {isSelf ? (
                          <span className="text-[9px] font-mono uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                            Active Logged-In Account
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                            Community Member
                          </span>
                        )}
                      </div>
                      {u.bio && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-1 leading-relaxed">
                          {u.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-wrap">
                    {!isSelf && currentUser && (
                      <>
                        <button
                          onClick={(e) => handleFollow(u.id, e)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                            isFollowing
                              ? "bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200"
                              : "bg-blue-600 border border-blue-600 text-white hover:bg-blue-700 shadow-sm"
                          }`}
                        >
                          {isFollowing ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                              <span>Following</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Follow</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={(e) => handleSimulateUserAction(u, e)}
                          disabled={simulatingUserId === u.id}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                          title="Simulate this user reacting to your profile and posts"
                        >
                          <Sparkles className={`w-3.5 h-3.5 text-amber-600 ${simulatingUserId === u.id ? "animate-spin" : ""}`} />
                          <span>Auto-Engage</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        onUserSelected(u);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                      title="View full profile"
                    >
                      <span>Profile</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>
              );
            }))}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400 font-mono">
          Showing {results.length} registered accounts
        </div>
      </div>
    </div>
  );
}
