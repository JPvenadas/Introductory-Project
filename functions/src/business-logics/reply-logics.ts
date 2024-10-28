// TODO write onReplyCreateLogic
//  increment comment repliesCount
//  create a notification for comment's author

// TODO write onReplyUpdateLogic
//  allow user to update reply content

// TODO write onReplyDeleteLogic
//  decrement comment repliesCount
//  delete the notification for comment's author

import {LogicConfig, LogicResultDoc} from "emberflow/lib/types";
import {Entity} from "../db-structure";
import {db} from "emberflow/lib";

export const onReplyDeleteLogic: LogicConfig = {
  name: "onReplyDeleteLogic",
  actionTypes: ["delete"],
  modifiedFields: "all",
  entities: [Entity.Reply],
  logicFn: async (action) => {
    const {
      eventContext: {
        docPath,
      },
      modifiedFields,
    } = action;

    const replyDoc = {
      ...modifiedFields,
    };


    const replyRef = db.doc(docPath);
    const commentDocRef = replyRef.parent.parent;

    if (!commentDocRef) {
      return {
        "name": "onReplyDeleteLogic",
        "status": "error",
        "documents": [],
        "message": `Invalid docPath at ${docPath}`,
      };
    }

    const commentRef = db.doc(commentDocRef.path);
    const commentDocSnapshot = await commentRef.get();
    const commentDoc = commentDocSnapshot.data();

    if (commentDoc === undefined) {
      return {
        "name": "onReplyDeleteLogic",
        "status": "error",
        "documents": [],
        "message": `Comment ${commentDocRef.id} does not exist`,
      };
    }

    const commentLogicResultDoc: LogicResultDoc = {
      "action": "merge",
      "dstPath": commentDocRef.path,
      "instructions": {
        "repliesCount": "--",
      },
    };
    const {
      "@id": commentId,
      "createdBy": {
        "@id": commentAuthorId,
      },
    } = commentDoc;

    const notificationDocPath = `users/
    ${commentAuthorId}/notifications/${commentId}`;

    const notificationLogicResultDoc: LogicResultDoc = {
      "action": "delete",
      "dstPath": notificationDocPath,
    };
    const replyLogicResultDoc: LogicResultDoc = {
      "action": "delete",
      "dstPath": docPath,
      "doc": replyDoc,
    };
    const logicResultDocs: LogicResultDoc[] = [];
    logicResultDocs.push(replyLogicResultDoc);
    logicResultDocs.push(notificationLogicResultDoc);
    logicResultDocs.push(commentLogicResultDoc);

    return {
      "name": "onReplyDeleteLogic",
      "status": "finished",
      "documents": logicResultDocs,
    };
  },
};
