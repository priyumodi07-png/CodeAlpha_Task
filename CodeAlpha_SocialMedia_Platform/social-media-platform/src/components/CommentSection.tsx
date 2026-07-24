import React, { useState, useEffect } from "react";
import { User, Comment } from "../types";
import { api } from "../api";
import { RefreshCw, MessageSquare, Send, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CommentSectionProps {
  postId: string;
  currentUser: User | null;
  onCommentAdded: () => void;
}

export default function CommentSection({
  postId,
  currentUser,
  onCommentAdded
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await api.getComments(postId);
      setComments(data);
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const added = await api.createComment(postId, {
        userId: currentUser.id,
        content: newComment.trim()
      });
      setComments(prev => [...prev, added]);
      setNewComment("");
      onCommentAdded();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCommentTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "just now";
    }
  };

  return (
    <div className="bg-slate-50/50 border-t border-slate-200 p-4 rounded-b-xl space-y-4">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
        <span>Comments ({comments.length})</span>
      </div>

      {/* Loading state */}
      {loading && comments.length === 0 ? (
        <div className="flex items-center justify-center py-4 gap-2 text-xs text-slate-400 font-mono">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
          <span>Loading comments...</span>
        </div>
      ) : (
        <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
          {comments.length === 0 ? (
            <p className="text-xs text-slate-400 py-1 text-center font-mono">
              No comments yet. Be the first to share your thoughts!
            </p>
          ) : (
            <AnimatePresence initial={false}>
              {comments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-200/70 shadow-xs"
                >
                  <img
                    src={comment.commenter.avatar}
                    alt={comment.commenter.displayName}
                    className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {comment.commenter.displayName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {formatCommentTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Comment Form */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="flex gap-2 items-center mt-3 pt-2 border-t border-slate-200/50">
          <img
            src={currentUser.avatar}
            alt={currentUser.displayName}
            className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-100"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 relative">
            <input
              type="text"
              id={`comment-input-${postId}`}
              placeholder="Write an insightful comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
              maxLength={200}
              className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-3 pr-10 text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-blue-600 disabled:text-slate-200 transition-colors cursor-pointer"
            >
              {submitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-xs text-slate-400 text-center font-mono py-1">
          Select or join with a user profile above to write a comment.
        </p>
      )}
    </div>
  );
}
