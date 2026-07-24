export interface User {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  joinedAt: string;
}

export interface UserProfile extends User {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  followers: string[];
  following: string[];
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  author: User;
  hasLiked: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  commenter: User;
}

export interface Stats {
  usersCount: number;
  postsCount: number;
  commentsCount: number;
  likesCount: number;
  followsCount: number;
}

export interface DatabaseStatus {
  useFirebase: boolean;
  projectId: string;
  fallbackMode: boolean;
}
