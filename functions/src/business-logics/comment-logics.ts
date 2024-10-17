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

export const onCommentDeleteLogic: LogicConfig = {
  name: "onCommentDeleteLogic",
  actionTypes: ["delete"],
  modifiedFields: "all",
  entities: [Entity.Comment],
  logicFn: async (action) => {
    const {
      eventContext: {
        docId,
        docPath,
      },
      document: {
        post,
      },
    } = action;

    const {
      "@id": postId,
      createdBy: {
        "@id": postAuthorId,
      },
    } = post;

    const postDocPath = `posts/${postId}`;
    const postLogicResultDoc: LogicResultDoc = {
      "action": "merge",
      "dstPath": postDocPath,
      "instructions": {
        "commentsCount": "--",
      },
    };

    const notificationDocPath = `users/${postAuthorId}/notifications/${docId}`;
    const notificationLogicResultDoc: LogicResultDoc = {
      "action": "delete",
      "dstPath": notificationDocPath,
    };

    const commentLogicResultDoc: LogicResultDoc = {
      "action": "delete",
      "dstPath": docPath,
    };

    const logicResultDocs: LogicResultDoc[] = [];
    logicResultDocs.push(commentLogicResultDoc);
    logicResultDocs.push(postLogicResultDoc);
    logicResultDocs.push(notificationLogicResultDoc);

    return {
      name: "onCommentDeleteLogic",
      status: "finished",
      documents: logicResultDocs,
    };
  },
};
