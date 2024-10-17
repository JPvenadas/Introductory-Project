import {Entity} from "emberflow/lib";
import {LogicConfig, LogicResultDoc} from "emberflow/lib/types";
import {DocumentData} from "firebase-admin/firestore";

// TODO write onCommentCreateLogic
//  increment post commentsCount
//  create a notification for post's author

export const onCommentUpdateLogic: LogicConfig = {
  name: "onCommentUpdateLogic",
  actionTypes: ["update"],
  modifiedFields: ["all"],
  entities: [Entity.Comment],
  logicFn: async (action) => {
    const {
      eventContext: {
        docPath,
      },
      modifiedFields: {
        content,
      },
    } = action;

    const commentDoc: DocumentData = {
      content,
    };

    const commentLogicResultDoc: LogicResultDoc = {
      "action": "merge",
      "dstPath": docPath,
      "doc": commentDoc,
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

// TODO write onCommentDeleteLogic
//  decrement post commentsCount
//  delete the notification for post's author
