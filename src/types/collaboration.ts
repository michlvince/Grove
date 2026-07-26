export type CreationMode = "personal" | "team";

export interface CreationMember {
  id: string;
  creationId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    title: string;
    image?: string | null;
  };
}

export interface ProjectChatMessage {
  id: string;
  creationId: string;
  userId: string;
  message: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    title: string;
    image?: string | null;
  };
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  read: boolean;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    title: string;
    image?: string | null;
  };
}

export interface FeedComment {
  id: string;
  creationId: string;
  userId: string;
  comment: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    title: string;
    image?: string | null;
  };
}

export interface FeedItem {
  id: string;
  title: string;
  worldId: string;
  status: string;
  mode: CreationMode;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    title: string;
    image?: string | null;
  };
  likesCount: number;
  commentsCount: number;
  hasLiked: boolean;
  entriesCount: number;
  latestEntry?: {
    type: string;
    content: string;
    createdAt: string;
  };
}
