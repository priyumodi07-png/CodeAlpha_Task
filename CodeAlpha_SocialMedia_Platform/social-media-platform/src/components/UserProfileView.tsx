import React, { useState, useEffect } from "react";
import { User, UserProfile, Post } from "../types";
import { api } from "../api";
import { RefreshCw, ArrowLeft, Edit2, Check, UserCheck, UserPlus, Image, FileText, Sparkles } from "lucide-react";
import PostCard from "./PostCard";

interface UserProfileViewProps {
  user: User;
  currentUser: User | null;
  onBack: () => void;
  onProfileUpdated: () => void;
  refreshSignal?: number;
}

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&h=150&fit=crop",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop"
];

export default function UserProfileView({
  user,
  currentUser,
  onBack,
  onProfileUpdated,
  refreshSignal
}: UserProfileViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [updating, setUpdating] = useState(false);

  // Follow states
  const [isFollowing, setIsFollowing] = useState(false);

  // Simulation states
  const [simulating, setSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState<string | null>(null);

  const handleSimulateCommunity = async () => {
    if (!profile) return;
    setSimulating(true);
    setSimMessage(null);
    try {
      const res = await api.simulateCommunityEngage(profile.id);
      const actorNames = res.actors.map(a => a.displayName).join(", ");
      setSimMessage(`✨ ${actorNames || "Network members"} liked your posts, commented, and followed your profile!`);
      await fetchProfileAndPosts();
      onProfileUpdated();
    } catch (err: any) {
      console.error(err);
      setSimMessage("Failed to simulate community activity.");
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    fetchProfileAndPosts();
  }, [user, currentUser, refreshSignal]);

  const fetchProfileAndPosts = async () => {
    setLoading(true);
    setLoadingPosts(true);
    try {
      // 1. Fetch user profile stats
      const p = await api.getUser(user.id);
      setProfile(p);
      setDisplayName(p.displayName);
      setBio(p.bio);
      setAvatar(p.avatar);

      // Check if current user is following this profile
      if (currentUser) {
        setIsFollowing(p.followers.includes(currentUser.id));
      }

      // 2. Fetch all posts and filter by this user ID
      const allPosts = await api.getPosts(currentUser?.id);
      const userPosts = allPosts.filter(post => post.userId === user.id);
      setPosts(userPosts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingPosts(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || updating) return;

    setUpdating(true);
    try {
      await api.updateUser(user.id, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatar
      });
      setIsEditing(false);
      onProfileUpdated();
      fetchProfileAndPosts();
    } catch (err) {
      console.error(err);
      alert("Failed to update profile details.");
    } finally {
      setUpdating(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser || !profile) return;
    
    // Optimistic UI updates
    const previousFollowing = isFollowing;
    const previousFollowersCount = profile.followersCount;

    setIsFollowing(!previousFollowing);
    setProfile({
      ...profile,
      followersCount: previousFollowing 
        ? Math.max(0, previousFollowersCount - 1)
        : previousFollowersCount + 1
    });

    try {
      const res = await api.toggleFollow(user.id, currentUser.id);
      setIsFollowing(res.following);
      setProfile(prev => prev ? {
        ...prev,
        followersCount: res.followersCount
      } : null);
      onProfileUpdated();
    } catch (err) {
      console.error(err);
      setIsFollowing(previousFollowing);
      setProfile(prev => prev ? {
        ...prev,
        followersCount: previousFollowersCount
      } : null);
    }
  };

  const isSelf = currentUser?.id === user.id;

  return (
    <div className="space-y-6">
      {/* Navigation Back Header */}
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
        <button
          onClick={onBack}
          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block leading-none">
            Viewing Profile
          </span>
          <h2 className="font-display font-semibold text-slate-800 text-sm">
            @{user.username}
          </h2>
        </div>
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center py-10 gap-2">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
            <span className="text-xs text-slate-400 font-mono">Loading profile card...</span>
          </div>
        ) : profile ? (
          <div>
            {!isEditing ? (
              /* View Mode */
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 justify-between">
                  <div className="flex flex-col sm:flex-row items-center gap-4.5">
                    <img
                      src={profile.avatar}
                      alt={profile.displayName}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-slate-100 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h3 className="font-display font-bold text-slate-900 text-lg">
                        {profile.displayName}
                      </h3>
                      <p className="text-xs text-slate-400">@{profile.username}</p>
                      <p className="text-[11px] font-mono text-slate-400 mt-1">
                        Joined {new Date(profile.joinedAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelf ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg py-2 px-4 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Profile</span>
                      </button>
                    ) : currentUser ? (
                      <button
                        onClick={handleFollowToggle}
                        className={`flex items-center gap-1.5 rounded-lg py-2 px-5 text-xs font-semibold shadow-sm transition-all cursor-pointer ${
                          isFollowing
                            ? "bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>

                {profile.bio && (
                  <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-lg">
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {profile.bio}
                    </p>
                  </div>
                )}

                {/* Profile Stats Counts */}
                <div className="grid grid-cols-3 gap-2 py-3.5 border-t border-b border-slate-100 text-center">
                  <div>
                    <span className="block font-display font-bold text-slate-900 text-base">
                      {profile.postsCount}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Posts</span>
                  </div>
                  <div>
                    <span className="block font-display font-bold text-slate-900 text-base">
                      {profile.followersCount}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Followers</span>
                  </div>
                  <div>
                    <span className="block font-display font-bold text-slate-900 text-base">
                      {profile.followingCount}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Following</span>
                  </div>
                </div>

                {/* Simulate Community Member Interactions */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleSimulateCommunity}
                    disabled={simulating}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 text-amber-300 ${simulating ? "animate-spin" : ""}`} />
                    <span>{simulating ? "Simulating Community Reaction..." : "Simulate Community Activity"}</span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-1.5">
                    Triggers other network members to follow this profile, like posts, and write AI comments!
                  </p>
                </div>

                {simMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 animate-fade-in flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="leading-snug">{simMessage}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Profile Edit Mode */
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-display font-bold text-sm text-slate-800">Edit Your Profile</h3>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-slate-400 hover:text-blue-600 cursor-pointer font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      maxLength={40}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Bio Description
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={200}
                      className="w-full h-20 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Profile Avatar URL
                    </label>
                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all mb-2"
                    />

                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
                      Or Pick From Gallery Presets
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {AVATAR_PRESETS.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatar(url)}
                          className={`rounded-full overflow-hidden border-2 cursor-pointer transition-all ${
                            avatar === url ? "border-blue-600 scale-105" : "border-transparent hover:border-slate-300"
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Preset ${idx}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  {updating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </form>
            )}
          </div>
        ) : (
          <p className="text-xs text-red-500 font-mono text-center">Failed to parse profile data.</p>
        )}
      </div>

      {/* User's Post Feed */}
      <div className="space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
          <FileText className="w-4 h-4" />
          <span>Feed posts by @{user.username} ({posts.length})</span>
        </div>

        {loadingPosts ? (
          <div className="flex flex-col items-center py-10 gap-2 bg-white border border-slate-200 rounded-xl">
            <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
            <span className="text-xs text-slate-400 font-mono">Loading user feed...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
            <p className="text-xs text-slate-400 font-mono">No posts published by this user yet.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={{
                  ...post,
                  author: profile || post.author // Use fresh profile info if updated
                }}
                currentUser={currentUser}
                onPostDeleted={fetchProfileAndPosts}
                onUserSelected={onBack} // They are already here
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
