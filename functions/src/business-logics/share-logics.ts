import {Action, LogicConfig, LogicResultDoc} from "emberflow/lib/types";
import {Entity} from "../db-structure";
import {db} from "emberflow/lib";
// TODO write onShareLogic
//  copy post to user's timeline
//  increment post sharesCount
//  create a notification for post's author


export const onShareLogic: LogicConfig = {
  name: "onShareLogic",
  actionTypes: ["create"],
  modifiedFields: ["all"],
  entities: [Entity.Share],
  logicFn: async (action: Action) => {
    const {
      eventContext: {
        docPath,
      },
      user,
    } = action;
    const shareDocRef = db.doc(docPath);
    const postDocRef = shareDocRef.parent.parent;

    if (!postDocRef) {
      return {
        name: "onShareLogic",
        status: "error",
        message: "Post not found",
        documents: [],
      };
    }

    const postDoc = await postDocRef.get();
    const post = postDoc.data();
    if (post === undefined) {
      return {
        name: "onShareLogic",
        status: "error",
        message: "Post not found",
        documents: [],
      };
    }

    const {
      "@id": postId,
      createdBy: {
        "@id": postAuthorId,
      },
    } = post;
    const timelineLogicResultDoc: LogicResultDoc = {
      action: "copy",
      dstPath: `users/${user["@id"]}/timeline/${postId}`,
      srcPath: docPath,
    };
    const postLogicResultDoc: LogicResultDoc = {
      action: "create",
      dstPath: docPath,
      instructions: {
        "sharesCount": "++",
      },
    };

    const notificationLogicResultDoc: LogicResultDoc = {
      action: "create",
      dstPath: `users/${postAuthorId}/notifications/${postId}`,
    };
    const logicResultDocs: LogicResultDoc[] = [];
    logicResultDocs.push(timelineLogicResultDoc);
    logicResultDocs.push(postLogicResultDoc);
    logicResultDocs.push(notificationLogicResultDoc);


    return {
      name: "onShareLogic",
      status: "finished",
      documents: logicResultDocs,
    };
  },
};
