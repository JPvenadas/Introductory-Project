// TODO write onLikeLogic
//  increment post likesCount
//  add user's userView to post's likes collection
//  create a notification for post's author

import {admin, db} from "emberflow/lib";
import {LogicConfig, LogicResultDoc} from "emberflow/lib/types";
import {createUserView} from "./utils";

export const onLikeLogic: LogicConfig = {
  name: "onLikeLogic",
  actionTypes: ["create"],
  modifiedFields: "all",
  entities: ["like"],
  logicFn: async (action) => {
    const {
      eventContext: {
        docPath,
        docId,
      },
      user,
    } = action;

    const postRef = db.doc(docPath);
    const postDocRef = postRef.parent.parent;
    if (!postDocRef) {
      return {
        name: "onLikeLogic",
        status: "error",
        documents: [],
        message: `Invalid post docpath at ${docPath}`,
      };
    }

    const postDocSnapshot = await postDocRef.get();
    const postDoc = postDocSnapshot.data();
    if (!postDoc) {
      return {
        name: "onLikeLogic",
        status: "error",
        documents: [],
        message: `Post ${postDocRef.id} does not exist`,
      };
    }

    const postLogicResultDoc: LogicResultDoc = {
      action: "merge",
      dstPath: postDocRef.path,
      instructions: {
        likesCount: "++",
      },
    };

    const userView = createUserView(user);
    const now = admin.firestore.Timestamp.now();

    const likeDoc = {
      user: userView,
    };

    const likeDocPath = `posts/${postDocRef.id}/likes/${docId}`;
    const likeLogicResultDoc: LogicResultDoc = {
      action: "create",
      dstPath: likeDocPath,
      doc: likeDoc,
    };

    const notificationDoc = {
      createdBy: userView,
      createdAt: now.toDate(),
      type: "like",
      post: {
        id: postDocRef.id,
        content: postDoc.content,
      },
    };

    const notifDocPath = `users/${postDoc.createdBy.id}/notifications/${docId}`;
    const notificationLogicResultDoc: LogicResultDoc = {
      action: "create",
      dstPath: notifDocPath,
      doc: notificationDoc,
    };

    const logicResultDocs: LogicResultDoc[] = [];
    logicResultDocs.push(postLogicResultDoc);
    logicResultDocs.push(likeLogicResultDoc);
    logicResultDocs.push(notificationLogicResultDoc);

    return {
      name: "onLikeLogic",
      status: "finished",
      documents: logicResultDocs,
    };
  },
};


// TODO write onUnlikeLogic
//  decrement post likesCount
//  remove user's userView from post's likes collection
//  delete the notification for post's author
