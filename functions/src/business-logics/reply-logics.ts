// TODO write onReplyCreateLogic
//  increment comment repliesCount
//  create a notification for comment's author

// TODO write onReplyUpdateLogic
//  allow user to update reply content

import {LogicConfig, LogicResultDoc} from "emberflow/lib/types";
import {Entity} from "../db-structure";
import {firestore} from "firebase-admin";
import DocumentData = firestore.DocumentData;

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
