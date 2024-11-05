import {Action, LogicConfig, LogicResultDoc} from "emberflow/lib/types";
import {Entity} from "../db-structure";
import {admin, db} from "emberflow/lib";
import {Notification, Post, User} from "../types";
import {createUserView} from "./utils";
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
        uid,
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
      dstPath: `users/${uid}/timeline/${postId}`,
      srcPath: postDocRef.path,
    };

    const postLogicResultDoc: LogicResultDoc = {
      action: "merge",
      dstPath: postDocRef.path,
      instructions: {
        "sharesCount": "++",
      },
    };

    const notificationDoc: Notification = {
      "@id": "",
      "createdAt": admin.firestore.Timestamp.now().toDate(),
      "createdBy": user as User,
      "read": false,
      "type": "share",
      "post": post as Post,
    };

    const notificationLogicResultDoc: LogicResultDoc = {
      action: "create",
      dstPath: `users/${postAuthorId}/notifications/${postId}`,
      doc: notificationDoc,
    };

    const userView = createUserView(user);
    const userLogicResultDoc: LogicResultDoc = {
      action: "create",
      dstPath: docPath,
      doc: userView,
    };
    const logicResultDocs: LogicResultDoc[] = [];
    logicResultDocs.push(timelineLogicResultDoc);
    logicResultDocs.push(postLogicResultDoc);
    logicResultDocs.push(notificationLogicResultDoc);
    logicResultDocs.push(userLogicResultDoc);


    return {
      name: "onShareLogic",
      status: "finished",
      documents: logicResultDocs,
    };
  },
};
