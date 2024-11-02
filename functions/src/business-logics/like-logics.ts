import {LogicConfig, LogicResultDoc} from "emberflow/lib/types";
import {Entity} from "../db-structure";
import {db} from "emberflow/lib";
// TODO write onLikeLogic
//  increment post likesCount
//  add user's userView to post's likes collection
//  create a notification for post's author


export const onUnlikeLogic: LogicConfig = {
  name: "onUnlikeLogic",
  actionTypes: ["delete"],
  modifiedFields: "all",
  entities: [Entity.Like],
  logicFn: async (action) => {
    const {
      eventContext: {
        docPath,
        docId,
      },
    } = action;

    const likeRef = db.doc(docPath);
    const postRef = likeRef.parent.parent;

    if (!postRef) {
      return {
        name: "onUnlikeLogic",
        status: "error",
        error: {
          message: `Invalid like document path at ${docPath}`,
        },
        documents: [],
      };
    }

    const postSnapshot = await postRef.get();
    const postDoc = postSnapshot.data();
    if (postDoc === undefined) {
      return {
        name: "onUnlikeLogic",
        status: "error",
        error: {
          message: `Post ${postRef.id} does not exist`,
        },
        documents: [],
      };
    }

    const {
      "@id": postId,
      createdBy: {
        "@id": postAuthorId,
      },
    } = postDoc;

    const logicResultDocs: LogicResultDoc[] = [];
    const postLogicResultDoc: LogicResultDoc = {
      action: "merge",
      dstPath: `posts/${postId}`,
      instructions: {
        likesCount: "--",
      },
    };
    const likeLogicResultDoc: LogicResultDoc = {
      action: "delete",
      dstPath: docPath,
    };

    const notificationLogicResultDoc: LogicResultDoc = {
      action: "delete",
      dstPath: `users/${postAuthorId}/notifications/${docId}`,
    };

    logicResultDocs.push(postLogicResultDoc);
    logicResultDocs.push(likeLogicResultDoc);
    logicResultDocs.push(notificationLogicResultDoc);

    return {
      name: "onUnlikeLogic",
      status: "finished",
      documents: logicResultDocs,
    };
  },
};


// TODO write onUnlikeLogic
//  decrement post likesCount
//  remove user's userView from post's likes collection
//  delete the notification for post's author
