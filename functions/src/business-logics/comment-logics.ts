// TODO write onCommentCreateLogic
import {LogicConfig, LogicResultDoc} from "emberflow/lib/types";
import {Entity} from "../db-structure";
import {firestore} from "firebase-admin";
import DocumentData = firestore.DocumentData;
import {createUserView} from "./utils";
import {UserView} from "../types";
import {admin} from "emberflow/lib";

export const onCommentCreateLogic: LogicConfig = {
//  increment post commentsCount
//  create a notification for post's author
  name: "onCommentCreateLogic",
  actionTypes: ["create"],
  modifiedFields: "all",
  entities: [Entity.Comment],
  logicFn: async (action) => {
    const {
      eventContext: {
        docId,
        docPath,
      },
      user,
      modifiedFields,
    } = action;
    const {...fields} = modifiedFields;
    const now: firestore.Timestamp = admin.firestore.Timestamp.now();

    const userView: UserView = createUserView(user);


    const commentDoc: DocumentData ={
      ...fields,
      "@id": docId,
      "createdBy": userView,
      "createdAt": now,
      "repliesCount": 0,
    };
    const commentLogicResultDoc: LogicResultDoc = {
      "action": "create",
      "dstPath": docPath,
      "doc": commentDoc,
    };
    const notificationDoc: DocumentData = {
      "@id": docId,
      "createdBy": userView,
      "createdAt": now,
      "type": "comment",
      "read": false,
    };

    const notificationLogicResultDoc: LogicResultDoc = {
      "action": "create",
      "dstPath": `users/${fields.postId}/notifications/${docId}`,
      "doc": notificationDoc,
    };

    const postSnapshot = await admin.firestore().doc(`posts/${fields.postId}`).get();
    const postDoc = postSnapshot.data();
    if (postDoc) {
      postDoc["commentsCount"] = postDoc["commentsCount"] + 1;
    }

    const postLogicResultDoc: LogicResultDoc = {
      "action": "merge",
      "dstPath": `posts/${fields.postId}`,
      "doc": postDoc,
    };

    const logicResultDocs: LogicResultDoc[] = [];
    logicResultDocs.push(commentLogicResultDoc);
    logicResultDocs.push(notificationLogicResultDoc);
    logicResultDocs.push(postLogicResultDoc);

    return {
      name: "onCommentCreateLogic",
      status: "finished",
      documents: logicResultDocs,
    };
  },
};
// TODO write onCommentUpdateLogic
//  allow user to update comment content
//  update the notification for post's author

// TODO write onCommentDeleteLogic
//  decrement post commentsCount
//  delete the notification for post's author
