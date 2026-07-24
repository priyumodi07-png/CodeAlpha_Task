import { useState, useEffect } from "react";
import { api } from "./api";
import { User, Post, Stats, DatabaseStatus } from "./types";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import PostCard from "./components/PostCard";
import UserProfileView from "./components/UserProfileView";
import CreateUserModal from "./components/CreateUserModal";
import AccountSearchModal from "./components/AccountSearchModal";
import { Sparkles, Compass, Users, RefreshCw, AlertCircle, Search, Hash, Filter } from "lucide-react";

const TOPIC_TAGS = [
  { id: "all", label: "All Posts" },
  { id: "#Tech", label: "#Tech" },
  { id: "#Design", label: "#Design" },
  { id: "#Travel", label: "#Travel" },
  { id: "#AI", label: "#AI" },
  { id: "#Photography", label: "#Photography" },
  { id: "#Food", label: "#Food" }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);

  // Layout states
  const [activeProfileView, setActiveProfileView] = useState<User | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [feedTab, setFeedTab] = useState<"all" | "following">("all");
  const [followingUserIds, setFollowingUserIds] = useState<string[]>([]);
  const [profileRefreshSignal, setProfileRefreshSignal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      api.getUser(currentUser.id)
        .then(p => setFollowingUserIds(p.following || []))
        .catch(err => console.error(err));
    }
  }, [currentUser, posts, profileRefreshSignal]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFollowToggled = () => {
    setProfileRefreshSignal(prev => prev + 1);
  };

  useEffect(() => {
    initialLoad();
  }, []);

  const initialLoad = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch users
      const allUsers = await api.getUsers();
      setUsers(allUsers);

      // Default current user to first user seed if any exists
      if (allUsers.length > 0 && !currentUser) {
        setCurrentUser(allUsers[0]);
      }

      // 2. Fetch stats
      const databaseStats = await api.getStats();
      setStats(databaseStats);

      // 3. Fetch feed posts
      const feedPosts = await api.getPosts(allUsers[0]?.id || undefined);
      setPosts(feedPosts);

      // 4. Fetch database status
      try {
        const status = await api.getStatus();
        setDbStatus(status);
      } catch (statusErr) {
        console.error("Failed to fetch database status:", statusErr);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the backend server. Make sure the database is seeded.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshFeed = async () => {
    if (!currentUser) return;
    setRefreshing(true);
    setProfileRefreshSignal(prev => prev + 1);
    try {
      const feedPosts = await api.getPosts(currentUser.id);
      setPosts(feedPosts);

      const allUsers = await api.getUsers();
      setUsers(allUsers);

      const databaseStats = await api.getStats();
      setStats(databaseStats);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  // Triggered when current switcher changes the persona
  const handleUserSelect = async (selectedUser: User) => {
    setCurrentUser(selectedUser);
    setLoading(true);
    try {
      // Refetch posts enriched with liked status for the new active user
      const feedPosts = await api.getPosts(selectedUser.id);
      setPosts(feedPosts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewUserCreated = (newUser: User) => {
    // Append to list of available users
    setUsers(prev => [...prev, newUser]);
    // Set as currently logged-in persona immediately
    handleUserSelect(newUser);
  };

  const handleOpenSearchModal = (query?: string) => {
    setSearchInitialQuery(query || "");
    setShowSearchModal(true);
  };

  const handleProfileViewBack = () => {
    setActiveProfileView(null);
    handleRefreshFeed(); // Refresh feeds on returning
  };

  // Filter posts based on selected tab and topic tag
  const displayedPosts = posts.filter(post => {
    // Following Tab filter
    if (feedTab === "following" && currentUser) {
      const isAuthorFollowed = followingUserIds.includes(post.userId) || post.userId === currentUser.id;
      if (!isAuthorFollowed) return false;
    }

    // Hashtag/Topic Tag filter
    if (selectedTag !== "all") {
      return post.content.toLowerCase().includes(selectedTag.toLowerCase());
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white pb-12">
      {/* Platform Header Navigation */}
      <Header
        currentUser={currentUser}
        users={users}
        onUserSelect={handleUserSelect}
        onOpenCreateUser={() => setShowCreateUser(true)}
        onOpenSearchModal={handleOpenSearchModal}
        stats={stats}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-6">
        {dbStatus && dbStatus.fallbackMode && (
          <div className="mb-6 bg-amber-50/85 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-800 flex items-start gap-3.5 shadow-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold tracking-wide uppercase text-[10px] text-amber-700">Database offline fallback active</p>
              <p className="leading-relaxed">
                The Cloud Firestore API is disabled or not fully configured for your Firebase project (<code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono text-[10px]">{dbStatus.projectId}</code>). 
                The app has automatically activated a <strong>fully operational local fallback database (<code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono text-[10px]">db.json</code>)</strong>, so you can safely create profiles, write posts, follow users, and comment on articles immediately.
              </p>
              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                <a 
                  href={`https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${dbStatus.projectId}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded transition-all shadow-xs cursor-pointer"
                >
                  Enable Cloud Firestore API
                </a>
                <span className="text-amber-400 hidden sm:inline">|</span>
                <span className="text-amber-600 font-mono text-[10px]">Your local data is saved in real-time in db.json</span>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500 font-mono">Initializing Verve social graph...</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto text-center py-16 bg-white border border-slate-200 rounded-xl p-6 shadow-sm mt-12">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="font-display font-bold text-slate-900 text-sm mb-1">Connection Error</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">{error}</p>
            <button
              onClick={initialLoad}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT PROFILE & ACTIONS RAIL (4 columns) */}
            <div className="lg:col-span-4 lg:sticky lg:top-22 space-y-6">
              <Sidebar
                currentUser={currentUser}
                users={users}
                onPostCreated={handleRefreshFeed}
                onUserSelected={(user) => setActiveProfileView(user)}
                refreshSignal={profileRefreshSignal}
                onFollowToggled={handleFollowToggled}
              />
            </div>

            {/* MIDDLE/RIGHT TIMELINE FEED (8 columns) */}
            <div className="lg:col-span-8 space-y-5">
              {activeProfileView ? (
                /* Profile view overlay block */
                <UserProfileView
                  user={activeProfileView}
                  currentUser={currentUser}
                  onBack={handleProfileViewBack}
                  onProfileUpdated={() => {
                    initialLoad();
                    handleFollowToggled();
                  }}
                  refreshSignal={profileRefreshSignal}
                />
              ) : (
                /* Standard Feed Timeline */
                <div className="space-y-5">
                  {/* Tab Selector Headers */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm gap-2">
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <button
                        onClick={() => setFeedTab("all")}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          feedTab === "all"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Explore Posts</span>
                      </button>

                      <button
                        onClick={() => setFeedTab("following")}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          feedTab === "following"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Social Circle</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleOpenSearchModal()}
                        className="flex items-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        title="Search and discover account names"
                      >
                        <Search className="w-3.5 h-3.5 text-slate-500" />
                        <span>Search Accounts</span>
                      </button>

                      <button
                        onClick={handleRefreshFeed}
                        disabled={refreshing}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
                        title="Reload feed"
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {/* Topic Hashtag Filter Bar */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
                      <Filter className="w-3 h-3 text-slate-400" />
                      Filter:
                    </span>
                    {TOPIC_TAGS.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTag(t.id)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                          selectedTag === t.id
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Empty State checks */}
                  {displayedPosts.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                      <Sparkles className="w-8 h-8 text-blue-600 fill-blue-600/10 mx-auto mb-3 animate-pulse" />
                      <h4 className="font-display font-semibold text-slate-800 text-sm">No matching posts found</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                        {selectedTag !== "all" ? `No posts tagged with ${selectedTag} yet.` : "Be the pioneer of this digital space! Use the composer to publish a post."}
                      </p>
                      {selectedTag !== "all" && (
                        <button
                          onClick={() => setSelectedTag("all")}
                          className="mt-3 text-xs font-bold text-blue-600 hover:underline"
                        >
                          Clear topic filter
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Feed Listing */
                    <div className="space-y-5">
                      {displayedPosts.map(post => (
                        <PostCard
                          key={post.id}
                          post={post}
                          currentUser={currentUser}
                          onPostDeleted={handleRefreshFeed}
                          onUserSelected={(user) => setActiveProfileView(user)}
                          onFollowToggled={handleFollowToggled}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      {/* Profile Registration Modal */}
      {showCreateUser && (
        <CreateUserModal
          onClose={() => setShowCreateUser(false)}
          onUserCreated={handleNewUserCreated}
        />
      )}

      {/* Account Search Modal */}
      {showSearchModal && (
        <AccountSearchModal
          initialQuery={searchInitialQuery}
          currentUser={currentUser}
          users={users}
          onClose={() => setShowSearchModal(false)}
          onUserSelected={(user) => {
            setActiveProfileView(user);
            setShowSearchModal(false);
          }}
          onUserSwitch={(user) => {
            handleUserSelect(user);
            setShowSearchModal(false);
          }}
          onFollowToggle={handleFollowToggled}
        />
      )}
    </div>
  );
}
