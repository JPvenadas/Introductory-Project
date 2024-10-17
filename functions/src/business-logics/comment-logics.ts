import {Entity} from "../db-structure";
import {LogicConfig, LogicResultDoc} from "emberflow/lib/types";
import {db} from "emberflow/lib";
// TODO write onCommentCreateLogic
//  increment post commentsCount
//  create a notification for post's author

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
