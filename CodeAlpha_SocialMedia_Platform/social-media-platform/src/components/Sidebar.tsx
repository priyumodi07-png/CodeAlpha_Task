import React, { useState, useEffect } from "react";
import { User, UserProfile } from "../types";
import { Image, Send, RefreshCw, Check, ArrowRight, UserCheck, UserPlus } from "lucide-react";
import { api } from "../api";

interface SidebarProps {
  currentUser: User | null;
  users: User[];
  onPostCreated: () => void;
  onUserSelected: (user: User) => void;
  refreshSignal?: number;
  onFollowToggled?: () => void;
}

const PRESET_IMAGES = [
  { id: "tech", label: "💻 Tech", url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80" },
  { id: "nature", label: "🌲 Nature", url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&auto=format&fit=crop&q=80" },
  { id: "travel", label: "✈️ Travel", url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80" },
  { id: "ai", label: "🧠 AI & Science", url: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=80" },
  { id: "food", label: "🥐 Culinary", url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=80" },
  { id: "art", label: "🎨 Art & Design", url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=80" }
];

export default function Sidebar({
  currentUser,
  users,
  onPostCreated,
  onUserSelected,
  refreshSignal,
  onFollowToggled
}: SidebarProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Post composer state
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [showCustomImage, setShowCustomImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suggestions state
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser, refreshSignal]);

  const fetchProfile = async () => {
    if (!currentUser) return;
    setLoadingProfile(true);
    try {
      const p = await api.getUser(currentUser.id);
      setProfile(p);
      
      // Build followers map for suggestions
      const map: Record<string, boolean> = {};
      p.following.forEach(id => {
        map[id] = true;
      });
      setFollowingMap(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !content.trim()) return;

    setSubmitting(true);
    setError(null);

    const activeImageUrl = selectedPreset 
      ? PRESET_IMAGES.find(p => p.id === selectedPreset)?.url 
      : (imageUrl.trim() || undefined);

    try {
      await api.createPost({
        userId: currentUser.id,
        content: content.trim(),
        imageUrl: activeImageUrl
      });
      setContent("");
      setImageUrl("");
      setSelectedPreset(null);
      setShowCustomImage(false);
      onPostCreated();
      // Refetch profile to update post count
      fetchProfile();
    } catch (err: any) {
      setError("Failed to share your post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFollowToggle = async (targetId: string) => {
    if (!currentUser) return;
    const currentlyFollowing = followingMap[targetId];
    
    // Optimistic UI update
    setFollowingMap(prev => ({
      ...prev,
      [targetId]: !currentlyFollowing
    }));

    if (profile) {
      setProfile({
        ...profile,
        followingCount: currentlyFollowing 
          ? Math.max(0, profile.followingCount - 1)
          : profile.followingCount + 1,
        following: currentlyFollowing
          ? profile.following.filter(id => id !== targetId)
          : [...profile.following, targetId]
      });
    }

    try {
      const res = await api.toggleFollow(targetId, currentUser.id);
      // Synchronize with server response
      setFollowingMap(prev => ({
        ...prev,
        [targetId]: res.following
      }));
      onFollowToggled?.();
    } catch (err) {
      console.error(err);
      // Revert optimistic updates
      setFollowingMap(prev => ({
        ...prev,
        [targetId]: currentlyFollowing
      }));
      if (profile) {
        setProfile(profile);
      }
    }
  };

  const handlePresetSelect = (presetId: string) => {
    if (selectedPreset === presetId) {
      setSelectedPreset(null);
    } else {
      setSelectedPreset(presetId);
      setImageUrl("");
      setShowCustomImage(false);
    }
  };

  // Suggest other users to follow (excluding current user)
  const suggestions = users.filter(u => u.id !== currentUser?.id);

  return (
    <aside className="w-full flex flex-col gap-6">
      {/* 1. CURRENT USER CARD */}
      {currentUser && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition-all hover:shadow-md">
          {loadingProfile ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
              <span className="text-xs text-slate-400 font-mono">Loading profile...</span>
            </div>
          ) : (
            <div>
              <div 
                onClick={() => onUserSelected(currentUser)}
                className="flex items-center gap-4 cursor-pointer group"
                title="View your profile"
              >
                <img
                  src={profile?.avatar || currentUser.avatar}
                  alt={currentUser.displayName}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-blue-500 shadow-inner transition-all"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-slate-900 group-hover:text-blue-600 truncate transition-colors">
                    {profile?.displayName || currentUser.displayName}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    @{profile?.username || currentUser.username}
                  </p>
                </div>
              </div>

              {profile?.bio && (
                <p className="text-xs text-slate-600 mt-4 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/50">
                  {profile.bio}
                </p>
              )}

              {/* Statistics Panel */}
              <div 
                onClick={() => onUserSelected(currentUser)}
                className="grid grid-cols-3 gap-2 mt-4 text-center border-t border-slate-100 pt-4 cursor-pointer hover:bg-slate-50/60 rounded-lg p-2 transition-colors"
                title="View profile details"
              >
                <div>
                  <p className="font-display font-bold text-slate-900 text-sm">
                    {profile?.postsCount ?? 0}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Posts</p>
                </div>
                <div>
                  <p className="font-display font-bold text-slate-900 text-sm">
                    {profile?.followersCount ?? 0}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Followers</p>
                </div>
                <div>
                  <p className="font-display font-bold text-slate-900 text-sm">
                    {profile?.followingCount ?? 0}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Following</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. CREATE POST COMPOSER */}
      {currentUser && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-display font-semibold text-sm text-slate-800 mb-3.5">
            Create a New Post
          </h3>
          
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div>
              <textarea
                id="post-content-input"
                placeholder="What is on your mind? Design? Inspiration? Code?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={400}
                required
                className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all resize-none"
              />
              <div className="flex justify-end text-[10px] text-slate-400 font-mono mt-1">
                {content.length}/400
              </div>
            </div>

            {/* Visual attachments selector */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Attach Visual Card (Optional)
              </label>
              
              <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5">
                {PRESET_IMAGES.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetSelect(p.id)}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold border transition-all truncate text-center cursor-pointer ${
                      selectedPreset === p.id 
                        ? "bg-blue-600 border-blue-600 text-white" 
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomImage(!showCustomImage);
                    setSelectedPreset(null);
                  }}
                  className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-blue-600 font-semibold transition-colors cursor-pointer"
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>{showCustomImage ? "Hide custom image link" : "Or use custom image URL..."}</span>
                </button>
              </div>

              {showCustomImage && (
                <input
                  type="url"
                  id="custom-image-url"
                  placeholder="Paste Unsplash or direct image URL..."
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setSelectedPreset(null);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
                />
              )}
            </div>

            {error && (
              <p className="text-xs text-red-500 font-medium">{error}</p>
            )}

            <button
              type="submit"
              id="submit-post-btn"
              disabled={submitting || !content.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none cursor-pointer"
            >
              {submitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Share Post</span>
            </button>
          </form>
        </div>
      )}

      {/* 3. SUGGESTIONS TO FOLLOW */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-display font-semibold text-sm text-slate-800 mb-3.5">
          Follow Connections
        </h3>

        <div className="space-y-4">
          {suggestions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2 font-mono">No other profiles yet.</p>
          ) : (
            suggestions.map(user => {
              const isFollowing = followingMap[user.id] || false;
              return (
                <div key={user.id} className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => onUserSelected(user)}
                    className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity min-w-0"
                  >
                    <img
                      src={user.avatar}
                      alt={user.displayName}
                      className="w-8.5 h-8.5 rounded-full object-cover bg-slate-100 ring-1 ring-slate-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate leading-tight hover:underline">
                        {user.displayName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        @{user.username}
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleFollowToggle(user.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all shrink-0 cursor-pointer ${
                      isFollowing
                        ? "bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200"
                        : "bg-blue-600 border border-blue-600 text-white hover:bg-blue-700 shadow-2xs"
                    }`}
                    title={isFollowing ? "Unfollow" : "Follow"}
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
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
