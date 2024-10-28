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
      document: {
        comment: commentDoc,
      },
    } = action;

    const replyDoc = {
      ...modifiedFields,
    };

    const {
      "@id": commentId,
      "createdBy": {
        "@id": commentAuthorId,
      },
    } = commentDoc;

    const replyRef = db.doc(docPath);
    const commentRef = replyRef.parent.parent;

    const notificationDocPath = `users/${commentAuthorId}/notifications/${commentId}`;
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

    return {
      "name": "onReplyDeleteLogic",
      "status": "finished",
      "documents": logicResultDocs,
    };
  },
};
