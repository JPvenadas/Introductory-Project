// TODO write onCommentCreateLogic
import {LogicConfig, LogicResultDoc} from "emberflow/lib/types";
import {Entity} from "../db-structure";
import {firestore} from "firebase-admin";
import DocumentData = firestore.DocumentData;
import {createUserView} from "./utils";
import {Notification, Post, UserView} from "../types";
import {admin, db} from "emberflow/lib";

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


    // increment post commentsCount
    const commentRef = db.doc(docPath);
    const postDocRef = commentRef.parent.parent;

    if (!postDocRef) {
      return {
        name: "onCommentCreateLogic",
        status: "error",
        documents: [],
        // message: `post ${postDocRef.id} does not exist`,
      };
    }

    const postRef = db.doc(postDocRef.path);
    const postDocSnapShot= await postRef.get();
    const postDoc = postDocSnapShot.data();
    if (postDoc === undefined) {
      return {
        name: "onCommentCreateLogic",
        status: "error",
        documents: [],
        message: `post ${postDocRef.id} does not exist`,
      };
    }

    postDoc.commentsCount += 1;

    const postLogicResultDoc: LogicResultDoc = {
      "action": "merge",
      "dstPath": `posts/${postDoc["@id"]}`,
      "doc": postDoc,
    };

    const userView: UserView = createUserView(user);
    const now: firestore.Timestamp = admin.firestore.Timestamp.now();

    const notificationDoc: Notification = {
      "@id": docId,
      "createdBy": userView,
      "createdAt": now.toDate(),
      "type": "comment",
      "read": false,
      "post": postDoc as Post,
    };

    const {postOwner} = postDoc["createdBy"];
    const notificationLogicResultDoc: LogicResultDoc = {
      "action": "create",
      "dstPath": `users/${postOwner["@id"]}/notifications/${docId}`,
      "doc": notificationDoc,
    };


    const {...fields} = modifiedFields;
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
