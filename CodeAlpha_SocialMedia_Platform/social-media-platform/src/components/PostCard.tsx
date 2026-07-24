import React, { useState, useEffect } from "react";
import { User, Post } from "../types";
import { api } from "../api";
import { Heart, MessageSquare, Trash2, Calendar, Check, UserPlus, UserCheck, Sparkles } from "lucide-react";
import CommentSection from "./CommentSection";

interface PostCardProps {
  key?: string | number;
  post: Post;
  currentUser: User | null;
  onPostDeleted: () => void;
  onUserSelected: (user: User) => void;
  onFollowToggled?: () => void;
}

export default function PostCard({
  post,
  currentUser,
  onPostDeleted,
  onUserSelected,
  onFollowToggled
}: PostCardProps) {
  const [hasLiked, setHasLiked] = useState(post.hasLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [deleting, setDeleting] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const handleSimulateEngage = async () => {
    setSimulating(true);
    try {
      const res = await api.simulateCommunityEngage(post.userId, post.id);
      if (res.likesAdded > 0) {
        setLikesCount(prev => prev + res.likesAdded);
      }
      if (res.commentsAddedCount > 0) {
        setCommentsCount(prev => prev + res.commentsAddedCount);
        setShowComments(true);
      }
      if (onFollowToggled) onFollowToggled();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);

  useEffect(() => {
    if (currentUser && post.author && post.author.id !== currentUser.id) {
      api.getUser(post.author.id)
        .then(u => {
          if (u.followers) {
            setIsFollowingAuthor(u.followers.includes(currentUser.id));
          }
        })
        .catch(() => {});
    }
  }, [currentUser, post.author]);

  const handleFollowAuthorToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    const prev = isFollowingAuthor;
    setIsFollowingAuthor(!prev);
    try {
      const res = await api.toggleFollow(post.author.id, currentUser.id);
      setIsFollowingAuthor(res.following);
      onFollowToggled?.();
    } catch (err) {
      console.error(err);
      setIsFollowingAuthor(prev);
    }
  };

  const handleLikeToggle = async () => {
    if (!currentUser) return;
    
    // Optimistic UI updates
    const previousLiked = hasLiked;
    const previousCount = likesCount;

    setHasLiked(!previousLiked);
    setLikesCount(prev => previousLiked ? Math.max(0, prev - 1) : prev + 1);

    try {
      const res = await api.toggleLike(post.id, currentUser.id);
      // Synchronize with server response
      setHasLiked(res.liked);
      setLikesCount(res.likesCount);
    } catch (err) {
      console.error(err);
      // Revert in case of failure
      setHasLiked(previousLiked);
      setLikesCount(previousCount);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || post.userId !== currentUser.id || deleting) return;
    if (!window.confirm("Are you sure you want to delete this post? This cannot be undone.")) return;

    setDeleting(true);
    try {
      await api.deletePost(post.id, currentUser.id);
      onPostDeleted();
    } catch (err) {
      console.error(err);
      alert("Failed to delete post.");
    } finally {
      setDeleting(false);
    }
  };

  const formatPostTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "";
    }
  };

  const isOwner = currentUser?.id === post.userId;

  return (
    <article className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
      {/* Post Author Bar */}
      <div className="flex items-center justify-between p-5 pb-3">
        <button
          onClick={() => onUserSelected(post.author)}
          className="flex items-center gap-3.5 text-left group min-w-0"
        >
          <img
            src={post.author.avatar}
            alt={post.author.displayName}
            className="w-10 h-10 rounded-full object-cover bg-slate-50 ring-2 ring-transparent group-hover:ring-slate-200 transition-all"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 group-hover:underline truncate">
              {post.author.displayName}
            </h4>
            <p className="text-[10px] text-slate-400 font-mono">
              @{post.author.username}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {!isOwner && currentUser && (
            <button
              type="button"
              onClick={handleFollowAuthorToggle}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
                isFollowingAuthor
                  ? "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
              }`}
            >
              {isFollowingAuthor ? (
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
          )}

          <span className="hidden sm:inline text-[10px] font-mono text-slate-400 flex items-center gap-1.5 ml-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {formatPostTime(post.createdAt)}
          </span>
          
          {/* Delete Action (only for owner) */}
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50/50 rounded transition-colors cursor-pointer"
              title="Delete post"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Post Text Content */}
      <div className="px-5 pb-4">
        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Post Image Cover (Optional) */}
      {post.imageUrl && (
        <div className="mx-5 mb-4 overflow-hidden rounded-lg border border-slate-200/50 max-h-96 flex items-center justify-center bg-slate-50">
          <img
            src={post.imageUrl}
            alt="Attached visual"
            className="w-full h-full object-cover select-none transition-transform duration-500 hover:scale-[1.01]"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Action Footer Bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-t border-slate-100 text-xs">
        {/* Like Button */}
        <button
          onClick={handleLikeToggle}
          disabled={!currentUser}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer ${
            !currentUser
              ? "text-slate-300 cursor-not-allowed"
              : hasLiked
              ? "text-red-600 bg-red-50 hover:bg-red-100"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          }`}
          title={!currentUser ? "Select profile to like" : hasLiked ? "Unlike" : "Like"}
        >
          <Heart
            className={`w-4 h-4 transition-transform ${
              hasLiked ? "fill-current scale-110 text-red-500" : "text-slate-400"
            }`}
          />
          <span>{likesCount}</span>
        </button>

        {/* Comment disclosure Button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer ${
            showComments
              ? "text-blue-600 bg-blue-50"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <MessageSquare className={`w-4 h-4 ${showComments ? "text-blue-600" : "text-slate-400"}`} />
          <span>{commentsCount}</span>
        </button>

        {/* AI / Community Auto-Engage Button */}
        <button
          onClick={handleSimulateEngage}
          disabled={simulating}
          className="ml-auto flex items-center gap-1.5 py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-lg font-bold transition-all cursor-pointer disabled:opacity-50"
          title="Simulate community users reacting and commenting on this post"
        >
          <Sparkles className={`w-3.5 h-3.5 text-amber-600 ${simulating ? "animate-spin" : ""}`} />
          <span className="hidden xs:inline text-[11px]">Community React</span>
        </button>
      </div>

      {/* Comments Drawer panel */}
      {showComments && (
        <CommentSection
          postId={post.id}
          currentUser={currentUser}
          onCommentAdded={() => setCommentsCount(prev => prev + 1)}
        />
      )}
    </article>
  );
}
