import {Entity} from "../db-structure";
import {LogicConfig, LogicResultDoc} from "emberflow/lib/types";
import {db} from "emberflow/lib";
// TODO write onCommentCreateLogic
import {LogicConfig, LogicResultDoc } from "emberflow/lib/types";
import { Entity } from "../db-structure";
import { firestore } from "firebase-admin";
import DocumentData = firestore.DocumentData;
import {Notification, Post, PostView, UserView} from "../types";
import { admin, db } from "emberflow/lib";
// eslint-disable-next-line import/namespace
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

    const postRef = db.doc(postDocRef.path);
    const postDocSnapShot = await postRef.get();
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

    const commentDoc: DocumentData = {
      ...modifiedFields,
      "@id": docId,
      "createdBy": userView,
      "createdAt": now,
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

// TODO write onCommentDeleteLogic
export const onCommentDeleteLogic: LogicConfig = {
  name: "onCommentDeleteLogic",
  actionTypes: ["delete"],
  modifiedFields: "all",
  entities: [Entity.Comment],
  logicFn: async (action) => {
    const {
      eventContext: {
        docPath,
        docId,
      },
    } = action;

    const commentRef = db.doc(docPath);
    const postDocRef = commentRef.parent.parent;
    if (!postDocRef) {
      return {
        name: "onCommentDeleteLogic",
        status: "error",
        documents: [],
        message: `Invalid post path at ${commentRef.path} `,
      };
    }
    const postRef = db.doc(postDocRef.path);
    const postSnapshot = await postRef.get();
    const postDoc = postSnapshot.data();

    if (postDoc === undefined) {
      return {
        name: "onCommentDeleteLogic",
        status: "error",
        documents: [],
        message: `Post ${postDocRef.id} not found`,
      };
    }

    const {
      createdBy: {
        "@id": postOwnerId,
      },
    } = postDoc;

    const commentResultDoc : LogicResultDoc = {
      "action": "delete",
      "dstPath": docPath,
    };
    const notificationResultDoc : LogicResultDoc = {
      "action": "delete",
      "dstPath": `users/${postOwnerId}/notifications/${docId}`,
    };

    const logicResultDocs : LogicResultDoc[] = [];
    logicResultDocs.push(commentResultDoc);
    logicResultDocs.push(notificationResultDoc);

    return {
      name: "onCommentDeleteLogic",
      status: "finished",
      documents: logicResultDocs,
    };
  },
};
//  decrement post commentsCount
//  delete the notification for post's author
