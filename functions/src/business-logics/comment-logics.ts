import {LogicConfig, LogicResultDoc} from "emberflow/lib/types";
import {Entity} from "../db-structure";
import {firestore} from "firebase-admin";
import DocumentData = firestore.DocumentData;
import {db} from "emberflow/lib";
// TODO write onCommentCreateLogic
//  increment post commentsCount
//  create a notification for post's author

// TODO write onCommentUpdateLogic


export const onCommentUpdateLogic: LogicConfig = {
  name: "onCommentUpdateLogic",
  actionTypes: ["update"],
  modifiedFields: "all",
  entities: [Entity.Comment],
  logicFn: async (action) => {
    const {
      eventContext: {
        docId,
        docPath,
      },
      document,
      modifiedFields,
    } = action;

    const commentRef = db.doc(docPath);
    const postDocRef = commentRef.parent.parent;
    if (!postDocRef) {
      return {
        name: "onCommentUpdateLogic",
        status: "error",
        documents: [],
        message: `Invalid path at ${commentRef.path} `,
      };
    }

    const postRef = db.doc(postDocRef.path);
    const postSnapshot = await postRef.get();
    const postDoc = postSnapshot.data();
    if (postDoc === undefined) {
      return {
        name: "onCommentUpdateLogic",
        status: "error",
        documents: [],
        message: `Post not found at ${postRef.path}`,
      };
    }

    const {
      "@id": postOwnerId,
    } = document.post;

    const notificationPath = `users/${postOwnerId}/notifications/${docId}`;
    const notificationResultDoc: LogicResultDoc = {
      "action": "merge",
      "dstPath": notificationPath,
    };

    const commentDoc: DocumentData = {...modifiedFields};
    const commentLogicResultDoc: LogicResultDoc = {
      action: "merge",
      dstPath: docPath,
      doc: commentDoc,
    };

    const logicResultDocs: LogicResultDoc[] = [];
    logicResultDocs.push(commentLogicResultDoc);
    logicResultDocs.push(notificationResultDoc);

    return {
      name: "onCommentUpdateLogic",
      status: "finished",
      documents: logicResultDocs,
    };
  },
};
//  allow user to update comment content
//  update the notification for post's author

// TODO write onCommentDeleteLogic
//  decrement post commentsCount
//  delete the notification for post's author
