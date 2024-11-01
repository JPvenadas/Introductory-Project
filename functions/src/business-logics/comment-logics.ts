import {Entity} from "../db-structure";
import {LogicConfig, LogicResultDoc} from "emberflow/lib/types";
import {DocumentData} from "firebase-admin/firestore";
import {firestore} from "firebase-admin";
import {Notification, Post, PostView, UserView} from "../types";
import {admin, db} from "emberflow/lib";
import {createUserView} from "./utils";

export const onCommentCreateLogic: LogicConfig = {
  //  increment post commentsCount
  //  create a notification for post's author
  name: "onCommentCreateLogic",
  actionTypes: ["create"],
  modifiedFields: "all",
  entities: [Entity.Comment],
  logicFn: async (action) => {
    const {
      eventContext: {docId, docPath},
      user,
      modifiedFields,
    } = action;

    // increment post commentsCount
    const commentRef = db.doc(docPath);
    const postDocRef = commentRef.parent.parent;

    if (!postDocRef) {
      return {
        name: "onCommentCreateLogic",
        status: "error",
        documents: [],
        message: `Invalid docPath at ${docPath}`,
      };
    }

    // const postRef = db.doc(postDocRef.path);
    const postDocSnapShot = await postDocRef.get();
    const postDoc = postDocSnapShot.data();
    if (postDoc === undefined) {
      return {
        name: "onCommentCreateLogic",
        status: "error",
        documents: [],
        message: `post ${postDocRef.id} does not exist`,
      };
    }

    const {
      "@id": postId,
      createdBy: {
        "@id": postOwnerId,
      },
    } = postDoc;

    const postLogicResultDoc: LogicResultDoc = {
      action: "merge",
      dstPath: `posts/${postId}`,
      instructions: {
        commentsCount: "++",
      },
    };

    const userView: UserView = createUserView(user);
    const now: firestore.Timestamp = admin.firestore.Timestamp.now();

    const notificationDoc: Notification = {
      "@id": docId,
      "createdBy": userView,
      "createdAt": now.toDate(),
      "type": "comment",
      "read": false,
      "post": postDoc as Post,
    };

    const notificationLogicResultDoc: LogicResultDoc = {
      action: "create",
      dstPath: `users/${postOwnerId}/notifications/${docId}`,
      doc: notificationDoc,
    };

    const postView: PostView = {
      "@id": postId,
      "createdAt": postDoc.createdAt,
      "createdBy": postDoc.createdBy,
    };

    const commentDoc: DocumentData= {
      ...modifiedFields,
      "@id": docId,
      "createdBy": userView,
      "createdAt": now.toDate(),
      "repliesCount": 0,
      "post": postView,
    };

    const commentLogicResultDoc: LogicResultDoc = {
      action: "create",
      dstPath: docPath,
      doc: commentDoc,
    };

    const logicResultDocs: LogicResultDoc[] = [];
    logicResultDocs.push(commentLogicResultDoc);
    logicResultDocs.push(notificationLogicResultDoc);
    logicResultDocs.push(postLogicResultDoc);

    return {
      name: "onCommentCreateLogic",
      status: "finished",
      documents: logicResultDocs,
    };
  },
};
// TODO write onCommentUpdateLogic
//  allow user to update comment content
//  update the notification for post's author
export const onCommentUpdateLogic: LogicConfig = {
  name: "onCommentUpdateLogic",
  actionTypes: ["update"],
  modifiedFields: ["all"],
  entities: [Entity.Comment],
  logicFn: async (action) => {
    const {
      eventContext: {docPath},
      modifiedFields: {content},
    } = action;

    const commentDoc: DocumentData = {
      content,
    };

    const commentLogicResultDoc: LogicResultDoc = {
      action: "merge",
      dstPath: docPath,
      doc: commentDoc,
    };

    const logicResultDocs: LogicResultDoc[] = [];
    logicResultDocs.push(commentLogicResultDoc);

    return {
      name: "onCommentUpdateLogic",
      status: "finished",
      documents: logicResultDocs,
    };
  },
};

export const onCommentDeleteLogic: LogicConfig = {
  name: "onCommentDeleteLogic",
  actionTypes: ["delete"],
  modifiedFields: "all",
  entities: [Entity.Comment],
  logicFn: async (action) => {
    const {
      eventContext: {docId, docPath},
      document: {post},
    } = action;

    const {
      "@id": postId,
      createdBy: {"@id": postAuthorId},
    } = post;

    const postDocPath = `posts/${postId}`;
    const postLogicResultDoc: LogicResultDoc = {
      action: "merge",
      dstPath: postDocPath,
      instructions: {
        commentsCount: "--",
      },
    };

    const notificationDocPath = `users/${postAuthorId}/notifications/${docId}`;
    const notificationLogicResultDoc: LogicResultDoc = {
      action: "delete",
      dstPath: notificationDocPath,
    };

    const commentLogicResultDoc: LogicResultDoc = {
      action: "delete",
      dstPath: docPath,
    };

    const logicResultDocs: LogicResultDoc[] = [];
    logicResultDocs.push(commentLogicResultDoc);
    logicResultDocs.push(postLogicResultDoc);
    logicResultDocs.push(notificationLogicResultDoc);

    return {
      name: "onCommentDeleteLogic",
      status: "finished",
      documents: logicResultDocs,
    };
  },
};
