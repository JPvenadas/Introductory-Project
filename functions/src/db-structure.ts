import {view} from "emberflow/lib/utils/db-structure";

export enum Entity {
  User = "user", // do not delete
  Notification = "notification",
  Post = "post",
  Like = "like",
  Comment = "comment",
  Reply = "reply",
  Share = "share",
  // Add your custom entities below
}

const UserViewProps = [
  "lastName",
  "firstName",
  "photoUrl",
];

// Map your custom entities to dbStructure below.
// Do not remove users and [Entity.User]
// by default, view matches the id attribute of the view so make the
// sure that a view has an id
export const dbStructure = {
  users: {
    [Entity.User]: {
      notifications: {
        [Entity.Notification]: {
          createdBy: view(Entity.User, UserViewProps),
        },
      },
      timeline: {
        [view(Entity.Post, ["content", "privacy", "file",
          "likesCount", "commentsCount", "sharesCount"])]: {},
      },
    },
  },
  posts: {
    [Entity.Post]: {
      createdBy: view(Entity.User, UserViewProps),
      comments: {
        [Entity.Comment]: {
          createdBy: view(Entity.User, UserViewProps),
        },
        replies: {
          [Entity.Reply]: {
            createdBy: view(Entity.User, UserViewProps),
          },
        },
      },
      likes: {
        [Entity.Like]: {
          createdBy: view(Entity.User, UserViewProps),
        },
      },
      shares: {
        [Entity.Share]: {
          createdBy: view(Entity.User, UserViewProps),
        },
      },
    },
  },
};
