interface BaseEntity {
  "@id": string;
}

export interface User extends BaseEntity {
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  username: string;
  birthDate?: Date;
  notifications?: Notification[];
  timeline?: Post[];
}

export interface UserView extends BaseEntity {
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface BaseFile {
  fileName: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface ImageFile extends BaseFile {
  type: "image";
}

export interface VideoFile extends BaseFile {
  type: "video";
}

export interface MiscFile extends BaseFile {
  type: "misc";
}

export type File = ImageFile | VideoFile | MiscFile;

type PostPrivacy = "public" | "friends" | "private";

export interface Post extends BaseEntity {
  content?: string;
  createdAt: Date;
  createdBy: UserView;
  privacy: PostPrivacy;
  file?: File;
  fileUrl?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  likes?: UserView[];
  comments?: Comment[];
}

export interface CommentView extends BaseEntity {
  createdAt: Date;
  createdBy: UserView;
}

export interface Comment extends BaseEntity {
  createdAt: Date;
  createdBy: UserView;
  content: string;
  repliesCount: number;
  replies?: Reply[];
}

export interface Reply extends BaseEntity {
  createdAt: Date;
  createdBy: UserView;
  content: string;
  comment: CommentView;
}

type NotificationType = "like" | "comment" | "reply" | "share";

export interface Notification extends BaseEntity {
  createdAt: Date;
  createdBy: UserView;
  type: NotificationType;
  read: boolean;
  post: Post;
}
