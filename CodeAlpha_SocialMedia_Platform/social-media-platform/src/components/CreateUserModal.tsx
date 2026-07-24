import React, { useState } from "react";
import { X, Sparkles, RefreshCw, Plus } from "lucide-react";
import { api } from "../api";
import { User } from "../types";

interface CreateUserModalProps {
  onClose: () => void;
  onUserCreated: (newUser: User) => void;
}

const AVATAR_SELECTIONS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop"
];

const PRESET_BIOS = [
  "🎨 Creative Frontend Engineer crafting accessible web apps.",
  "📸 Travel & Nature Photographer exploring wild horizons.",
  "💻 Fullstack Architect & Open Source contributor.",
  "🧠 AI & Machine Learning Researcher building future tech.",
  "🥐 Artisanal Chef & Culinary Content Creator."
];

export default function CreateUserModal({
  onClose,
  onUserCreated
}: CreateUserModalProps) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(AVATAR_SELECTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) return;

    // Clean username (alphanumeric and underscore only)
    const cleanedUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");
    if (!cleanedUsername) {
      setError("Username must contain letters or numbers.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newUser = await api.createUser({
        username: cleanedUsername,
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatar
      });
      onUserCreated(newUser);
      onClose();
    } catch (err: any) {
      setError(err.message || "Username already taken or invalid. Try another one.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4.5 top-4.5 p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-5">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg">
            <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
          </div>
          <h2 className="font-display font-bold text-slate-900 text-base">
            Create Profile
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Pick your Handle (No spaces)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                @
              </span>
              <input
                type="text"
                id="modal-username-input"
                placeholder="developer_pro"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
                required
                maxLength={15}
                className="w-full pl-7.5 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Display Name
            </label>
            <input
              type="text"
              id="modal-displayname-input"
              placeholder="Your Full Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={30}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Short Biography
            </label>
            <textarea
              id="modal-bio-input"
              placeholder="Tell other creators about your interests..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={150}
              className="w-full h-16 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all resize-none"
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {PRESET_BIOS.map((b, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setBio(b)}
                  className="text-[9px] font-mono bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 px-2 py-0.5 rounded border border-slate-200/60 transition-colors cursor-pointer truncate max-w-[180px]"
                  title={b}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
              Select Avatar Preset
            </label>
            <div className="grid grid-cols-5 gap-2 mb-2">
              {AVATAR_SELECTIONS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatar(url)}
                  className={`rounded-full overflow-hidden border-2 cursor-pointer transition-all aspect-square ${
                    avatar === url ? "border-blue-600 scale-105 shadow-sm" : "border-slate-100 hover:border-slate-300"
                  }`}
                >
                  <img
                    src={url}
                    alt={`Avatar option ${idx + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400">Or custom avatar image URL:</span>
            </div>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all mt-1"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium text-center">{error}</p>
          )}

          <button
            type="submit"
            id="register-submit-btn"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer mt-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>Register Profile</span>
          </button>
        </form>
      </div>
    </div>
  );
}
