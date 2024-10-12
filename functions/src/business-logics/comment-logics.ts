import {Entity} from "../db-structure";
import {LogicConfig, LogicResultDoc} from "emberflow/lib/types";
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
        uid,
      },
    } = action;

    const commentResultDoc : LogicResultDoc = {
      "action": "delete",
      "dstPath": docPath,
    };
    const notificationResultDoc : LogicResultDoc = {
      "action": "delete",
      "dstPath": `users/${uid}/notifications/${docId}`,
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
