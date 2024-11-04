import {admin, db} from "emberflow/lib";
import {LogicConfig, LogicResultDoc} from "emberflow/lib/types";
import {createUserView} from "./utils";
import {Post, PostView} from "../types";

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
    const postDoc = postDocSnapshot.data() as Post;
    if (!postDoc) {
      return {
        name: "onLikeLogic",
        status: "error",
        documents: [],
        message: `Post ${postDocRef.id} does not exist`,
      };
    }

    const {
      "@id": postId,
      createdBy: {
        "@id": postAuthorId,
      },
    } = postDoc;

    const postLogicResultDoc: LogicResultDoc = {
      action: "merge",
      dstPath: postDocRef.path,
      instructions: {
        likesCount: "++",
      },
    };

    const userView = createUserView(user);
    const now = admin.firestore.Timestamp.now();

    const likeDocPath = `posts/${postId}/likes/${docId}`;
    const likeLogicResultDoc: LogicResultDoc = {
      action: "create",
      dstPath: likeDocPath,
      doc: {...userView},
    };

    const notificationDoc = {
      createdBy: userView,
      createdAt: now.toDate(),
      type: "like",
      post: postDoc as PostView,
    };

    const notificationDocPath = `users/${postAuthorId}/notifications/${docId}`;
    const notificationLogicResultDoc: LogicResultDoc = {
      action: "create",
      dstPath: notificationDocPath,
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
