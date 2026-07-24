import { User, UserProfile, Post, Comment, Stats, DatabaseStatus } from "./types";

export const api = {
  // User endpoints
  async getUsers(): Promise<User[]> {
    const res = await fetch("/api/users");
    if (!res.ok) {
      throw new Error("Failed to fetch users");
    }
    return res.json();
  },

  async searchUsers(query: string): Promise<User[]> {
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      throw new Error("Failed to search users");
    }
    return res.json();
  },

  async getUser(id: string): Promise<UserProfile> {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) {
      throw new Error("Failed to fetch user");
    }
    return res.json();
  },

  async createUser(data: { username: string; displayName: string; bio?: string; avatar?: string }): Promise<User> {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to create user");
    }
    return res.json();
  },

  async updateUser(id: string, data: { displayName?: string; bio?: string; avatar?: string }): Promise<User> {
    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update user");
    }
    return res.json();
  },

  async toggleFollow(targetUserId: string, followerId: string): Promise<{ following: boolean; followersCount: number }> {
    const res = await fetch(`/api/users/${targetUserId}/follow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followerId }),
    });
    if (!res.ok) {
      throw new Error("Failed to toggle follow");
    }
    return res.json();
  },

  // Post endpoints
  async getPosts(userId?: string): Promise<Post[]> {
    const url = userId ? `/api/posts?userId=${userId}` : "/api/posts";
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Failed to fetch posts");
    }
    return res.json();
  },

  async createPost(data: { userId: string; content: string; imageUrl?: string }): Promise<Post> {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error("Failed to create post");
    }
    return res.json();
  },

  async deletePost(postId: string, userId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/posts/${postId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      throw new Error("Failed to delete post");
    }
    return res.json();
  },

  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    const res = await fetch(`/api/posts/${postId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      throw new Error("Failed to toggle like");
    }
    return res.json();
  },

  // Comment endpoints
  async getComments(postId: string): Promise<Comment[]> {
    const res = await fetch(`/api/posts/${postId}/comments`);
    if (!res.ok) {
      throw new Error("Failed to fetch comments");
    }
    return res.json();
  },

  async createComment(postId: string, data: { userId: string; content: string }): Promise<Comment> {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error("Failed to create comment");
    }
    return res.json();
  },

  // Stats
  async getStats(): Promise<Stats> {
    const res = await fetch("/api/stats");
    if (!res.ok) {
      throw new Error("Failed to fetch stats");
    }
    return res.json();
  },

  // Database Status
  async getStatus(): Promise<DatabaseStatus> {
    const res = await fetch("/api/status");
    if (!res.ok) {
      throw new Error("Failed to fetch database status");
    }
    return res.json();
  },

  // Community AI auto-engagement
  async simulateCommunityEngage(targetUserId: string, postId?: string, sourceUserId?: string): Promise<{
    success: boolean;
    actors: { id: string; username: string; displayName: string; avatar?: string }[];
    followsAdded: number;
    likesAdded: number;
    commentsAddedCount: number;
  }> {
    const res = await fetch("/api/community/engage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId, postId, sourceUserId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to simulate community engagement");
    }
    return res.json();
  }
};
