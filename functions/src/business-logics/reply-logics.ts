import {LogicConfig, LogicResultDoc} from "emberflow/lib/types";
import {Comment, Post, UserView} from "../types";
import {createUserView} from "./utils";
import {admin, db} from "emberflow/lib";
import {DocumentData} from "firebase-admin/firestore";
import {firestore} from "firebase-admin";
import {Entity} from "../db-structure";

export const onReplyCreateLogic: LogicConfig = {
  name: "onReplyCreateLogic",
  actionTypes: ["create"],
  modifiedFields: "all",
  entities: ["reply"],
  logicFn: async (action) => {
    const {
      eventContext: {
        docPath,
        docId,
      },
      user,
      modifiedFields,
    } = action;

    const replyRef = db.doc(docPath);
    const commentDocRef = replyRef.parent.parent;

    if (!commentDocRef) {
      return {
        name: "onReplyCreateLogic",
        status: "error",
        documents: [],
        message: `Invalid comment docpath at ${docPath}`,
      };
    }

    const commentRef = db.doc(commentDocRef.path);
    const commentDocSnapshot = await commentRef.get();
    const commentDoc = commentDocSnapshot.data() as Comment;

    if (!commentDoc) {
      return {
        name: "onReplyCreateLogic",
        status: "error",
        documents: [],
        message: `Comment ${commentDocRef.id} does not exist`,
      };
    }

    const commentLogicResultDoc: LogicResultDoc = {
      "action": "merge",
      "dstPath": commentRef.path,
      "instructions": {
        "repliesCount": "++",
      },
    };

    const userView: UserView = createUserView(user);
    const now: firestore.Timestamp = admin.firestore.Timestamp.now();

    const replyDoc: DocumentData = {
      ...modifiedFields,
      "@id": docId,
      "createdBy": userView,
      "createdAt": now.toDate(),
    };

    const replyLogicResultDoc: LogicResultDoc = {
      "action": "create",
      "dstPath": docPath,
      "doc": replyDoc,
    };

    const {
      post,
      createdBy: {
        "@id": commentAuthorId,
      },
    } = commentDoc;

    const notificationDoc: DocumentData = {
      "@id": docId,
      "createdBy": userView,
      "createdAt": now.toDate(),
      "type": "reply",
      "read": false,
      "post": post as Post,
    };

    const notifDocPath = `users/${commentAuthorId}/notifications/${docId}`;
    const notificationLogicResultDoc: LogicResultDoc = {
      "action": "create",
      "dstPath": notifDocPath,
      "doc": notificationDoc,
    };

    const logicResultDocs: LogicResultDoc[] = [];
    logicResultDocs.push(replyLogicResultDoc);
    logicResultDocs.push(commentLogicResultDoc);
    logicResultDocs.push(notificationLogicResultDoc);

    return {
      name: "onReplyCreateLogic",
      status: "finished",
      documents: logicResultDocs,
    };
  },
};

// TODO write onReplyUpdateLogic
//  allow user to update reply content


export const onReplyUpdateLogic: LogicConfig = {
  name: "onReplyUpdateLogic",
  actionTypes: ["update"],
  modifiedFields: "all",
  entities: [Entity.Reply],
  logicFn: async (action) => {
    const {
      eventContext: {
        docPath,
      },
      modifiedFields,
    } = action;

    const replyDoc: DocumentData = {
      ...modifiedFields,
    };

    const replyLogicResultDoc: LogicResultDoc = {
      "action": "merge",
      "dstPath": docPath,
      "doc": replyDoc,
    };

    const logicResultDocs: LogicResultDoc[] = [];
    logicResultDocs.push(replyLogicResultDoc);

    return {
      "name": "onReplyUpdateLogic",
      "status": "finished",
      "documents": logicResultDocs,

    };
  },
};

// TODO write onReplyDeleteLogic
//  decrement comment repliesCount
//  delete the notification for comment's author


export const onReplyDeleteLogic: LogicConfig = {
  name: "onReplyDeleteLogic",
  actionTypes: ["delete"],
  modifiedFields: "all",
  entities: [Entity.Reply],
  logicFn: async (action) => {
    const {
      eventContext: {docPath},
    } = action;


    const replyRef = db.doc(docPath);
    const commentDocRef = replyRef.parent.parent;

    if (!commentDocRef) {
      return {
        name: "onReplyDeleteLogic",
        status: "error",
        documents: [],
        message: `Invalid docPath at ${docPath}`,
      };
    }

    const commentDocSnapshot = await commentDocRef.get();
    const commentDoc = commentDocSnapshot.data();

    if (commentDoc === undefined) {
      return {
        name: "onReplyDeleteLogic",
        status: "error",
        documents: [],
        message: `Comment ${commentDocRef.id} does not exist`,
      };
    }

    const commentLogicResultDoc: LogicResultDoc = {
      action: "merge",
      dstPath: commentDocRef.path,
      instructions: {
        repliesCount: "--",
      },
    };
    const {
      "@id": commentId,
      createdBy: {"@id": commentAuthorId},
    } = commentDoc;

    const notificationDocPath = `users/
    ${commentAuthorId}/notifications/${commentId}`;

    const notificationLogicResultDoc: LogicResultDoc = {
      action: "delete",
      dstPath: notificationDocPath,
    };
    const replyLogicResultDoc: LogicResultDoc = {
      action: "delete",
      dstPath: docPath,
    };
    const logicResultDocs: LogicResultDoc[] = [];
    logicResultDocs.push(replyLogicResultDoc);
    logicResultDocs.push(notificationLogicResultDoc);
    logicResultDocs.push(commentLogicResultDoc);

    return {
      name: "onReplyDeleteLogic",
      status: "finished",
      documents: logicResultDocs,
    };
  },
};
