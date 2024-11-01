import {Action, EventContext} from "emberflow/lib/types";
import {initTestEmberflow} from "../init-test-emberflow";
import {UserView} from "../../src/types";
import {admin} from "emberflow/lib";
import {
  onCommentUpdateLogic,
  onCommentDeleteLogic,
} from "../../src/business-logics/comment-logics";

initTestEmberflow();

const userId = "userId";
const user: UserView = {
  "@id": userId,
  "avatarUrl": `users/${userId}/profile-picture.jpeg`,
  "firstName": "Sample",
  "lastName": "User",
};

describe("onCommentUpdateLogic", () => {
  const postId = "postId";
  const commentId = "commentId";
  const docPath = `posts/${postId}/comments/${commentId}`;
  const modifiedFields = {
    content: "Hello, World!",
  };
  const document = {
    content: "Hey, World!",
  };
  const eventContext = {
    docPath: docPath,
  } as EventContext;
  const action: Action = {
    actionType: "update",
    eventContext: eventContext,
    user: user,
    modifiedFields: modifiedFields,
    document: document,
    status: "new",
    timeCreated: admin.firestore.Timestamp.now(),
  };

  it("should return finished logic result with 1 document", async () => {
    const result = await onCommentUpdateLogic.logicFn(action);

    expect(result.name).toEqual("onCommentUpdateLogic");
    expect(result.status).toEqual("finished");
    expect(result.documents.length).toBe(1);
  });

  it("should return finished logic result to update comment document",
    async () => {
      const result = await onCommentUpdateLogic.logicFn(action);
      expect(result.documents[0]).toStrictEqual({
        action: "merge",
        dstPath: docPath,
        doc: modifiedFields,
      });
    });
});

describe("onCommentDeleteLogic", () => {
  const postId = "postId";
  const postAuthorId = "postAuthorId";
  const commentId = "commentId";
  const docPath = `posts/${postId}/comments/${commentId}`;
  const eventContext = {
    docId: commentId,
    docPath: docPath,
  } as EventContext;
  const document = {
    post: {
      "@id": postId,
      "createdBy": {
        "@id": postAuthorId,
      },
    },
  };
  const action: Action = {
    actionType: "delete",
    eventContext: eventContext,
    user: user,
    modifiedFields: {},
    document: document,
    status: "new",
    timeCreated: admin.firestore.Timestamp.now(),
  };

  it("should return finished logic result with 3 documents", async () => {
    const result = await onCommentDeleteLogic.logicFn(action);

    expect(result.name).toEqual("onCommentDeleteLogic");
    expect(result.status).toEqual("finished");
    expect(result.documents.length).toBe(3);
  });

  it("should return finished logic result to delete comment document",
    async () => {
      const result = await onCommentDeleteLogic.logicFn(action);
      expect(result.documents[0]).toStrictEqual({
        action: "delete",
        dstPath: docPath,
      });
    });

  it("should return finished logic result to decrement comment count document",
    async () => {
      const postDocPath = `posts/${postId}`;
      const result = await onCommentDeleteLogic.logicFn(action);

      expect(result.documents[1]).toStrictEqual({
        action: "merge",
        dstPath: postDocPath,
        instructions: {
          commentsCount: "--",
        },
      });
    });

  it("should return finished logic result to delete notification document",
    async () => {
      const notifDocPath = `users/${postAuthorId}/notifications/${commentId}`;
      const result = await onCommentDeleteLogic.logicFn(action);

      expect(result.documents[2]).toStrictEqual({
        action: "delete",
        dstPath: notifDocPath,
      });
    });
});
