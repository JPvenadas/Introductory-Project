import {LogicConfig, LogicResultDoc} from "emberflow/lib/types";
import {Entity} from "../db-structure";
import {firestore} from "firebase-admin";
import DocumentData = firestore.DocumentData;
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
        uid,
      },
      modifiedFields,
    } = action;

    const {...fields} = modifiedFields;
    const commentDoc: DocumentData = {...fields};

    const notificationPath = `users/${uid}/notifications/${docId}`;
    const notificationResultDoc: LogicResultDoc = {
      "action": "merge",
      "dstPath": notificationPath,
    };

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
