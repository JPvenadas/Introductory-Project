// import {firestore} from "firebase-admin";
import {onCommentCreateLogic, onCommentUpdateLogic, onCommentDeleteLogic} from "../../src/business-logics/comment-logics";
import {admin, db} from "emberflow/lib";
import {initTestEmberflow} from "../init-test-emberflow";
import {Comment, Post, PostView, UserView} from "../../src/types";
import {Action, EventContext} from "emberflow/lib/types";
import {firestore} from "firebase-admin";
import * as utils from "../../src/business-logics/utils";
import {DocumentData} from "firebase-admin/firestore";

initTestEmberflow();

const now = expect.any(admin.firestore.Timestamp);
const userId = "userId";
const user: UserView = {
  "@id": userId,
  "avatarUrl": `users/${userId}/profile-picture.jpeg`,
  "firstName": "Sample",
  "lastName": "User",
};

const post: Post = {
  "@id": "postId",
  "commentsCount": 0,
  "createdAt": now,
  "createdBy": user,
  "likesCount": 0,
  "privacy": "public",
  "sharesCount": 0,
};

const postView: PostView = {
  "@id": "postId",
  "createdAt": now,
  "createdBy": user,
};


describe("onCommentCreateLogic", () => {
  const modifiedFields = {
    content: "Hello, World!",
  };
  const commentId = "commentId";
  const docPath = `posts/postId/comments/${commentId}`;
  const invalidDocPath = "invalid/docPath";
  const nonExistentPostId = "nonExistentPostId";
  const eventContext = {
    uid: userId,
    docPath: docPath,
    docId: commentId,
  } as EventContext;

  const action: Action = {
    actionType: "create",
    eventContext: eventContext,
    user: user,
    document: {},
    status: "new",
    timeCreated: admin.firestore.Timestamp.now(),
    modifiedFields: modifiedFields,
  };

  const expectedNotificationDoc = {
    "@id": "commentId",
    "createdBy": user,
    "createdAt": expect.any(admin.firestore.Timestamp),
    "type": "comment",
    "read": false,
    "post": post,
  };

  const expectedCommentDoc: Comment = {
    "repliesCount": 0,
    "@id": commentId,
    "content": "Hello, World!",
    "createdBy": user,
    "createdAt": expect.any(admin.firestore.Timestamp),
    "post": postView,
  };


  beforeEach(() => {
    jest.spyOn(admin.firestore.Timestamp, "now").mockReturnValue({
      toDate: () => expect.any(admin.firestore.Timestamp),
    }as firestore.Timestamp);
    jest.spyOn(db, "doc")
      .mockImplementation((docPath) =>{
        const paths = docPath.split("/");
        const postDocIdIndex = 1;
        const postDocId = paths[postDocIdIndex];

        if (docPath === invalidDocPath) {
          return {
            parent: {
              parent: null,
            },
          } as unknown as firestore.DocumentReference<DocumentData>;
        }

        if (postDocId === nonExistentPostId) {
          return {
            parent: {
              parent: {
                get: jest.fn().mockResolvedValue({
                  data: () => undefined,
                }),
              },
            },
          } as unknown as firestore.DocumentReference<DocumentData>;
        }
        return {
          parent: {
            parent: {
              get: jest.fn().mockResolvedValue({
                data: jest.fn().mockReturnValue({
                  "@id": "postId",
                  "commentsCount": 0,
                  "likesCount": 0,
                  "sharesCount": 0,
                  "privacy": "public",
                  "createdAt": now,
                  "createdBy": {
                    "@id": userId,
                    "firstName": "Sample",
                    "lastName": "User",
                    "avatarUrl": `users/${userId}/profile-picture.jpeg`,
                  },
                }),
              }),
            },
          },
        } as unknown as firestore.DocumentReference;
      }
      );

    jest.spyOn(utils, "createUserView")
      .mockImplementation((user) => {
        return {
          "@id": user["@id"],
          "firstName": user.firstName,
          "lastName": user.lastName,
          "avatarUrl": user.avatarUrl,
        } as UserView;
      });
  });

  afterEach(()=> {
    jest.restoreAllMocks();
  });


  it("should return finished logic result with 3 docs", async () => {
    const result = await onCommentCreateLogic.logicFn(action);
    console.log(result);


    expect(result.name).toEqual("onCommentCreateLogic");
    expect(result.status).toEqual("finished");
    expect(result.documents.length).toBe(3);
  });

  it("should return finished logic result to create comment document",
    async () => {
      const result = await onCommentCreateLogic.logicFn(action);

      expect(result.documents[0]).toStrictEqual({
        action: "create",
        dstPath: docPath,
        doc: expectedCommentDoc,
      });
    });

  it("should return finished logic result to create notification document",
    async () => {
      const result = await onCommentCreateLogic.logicFn(action);

      expect(result.documents[1]).toStrictEqual({
        action: "create",
        dstPath: `users/${userId}/notifications/${commentId}`,
        doc: expectedNotificationDoc,
      });
    });
  it("should return finished logic result to update post document comment count",
    async () => {
      const result = await onCommentCreateLogic.logicFn(action);

      expect(result.documents[2]).toStrictEqual({
        action: "merge",
        dstPath: `posts/${post["@id"]}`,
        instructions: {
          commentsCount: "++",
        },
      });
    });
  it("should run the error path when docPath is invalid", async () =>{
    const result = await onCommentCreateLogic.logicFn({
      ...action,
      eventContext: {
        ...eventContext,
        docPath: invalidDocPath,
      },
    });
    expect(result.name).toBe("onCommentCreateLogic");
    expect(result.status).toBe("error");
    expect(result.documents.length).toBe(0);
    expect(result.message).toBe(`Invalid docPath at ${invalidDocPath}`);
  });

  it("should run the error path when post does not exist", async () => {
    const result = await onCommentCreateLogic.logicFn({
      ...action,
      eventContext: {
        ...eventContext,
        docPath: `posts/${nonExistentPostId}/comments/${commentId}`,
      },
    });
    expect(result.name).toBe("onCommentCreateLogic");
    expect(result.status).toBe("error");
    expect(result.documents.length).toBe(0);
  });
});

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

  it("should return finished logic result to update comment document", async () => {
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

  it("should return finished logic result to delete comment document", async () => {
    const result = await onCommentDeleteLogic.logicFn(action);
    expect(result.documents[0]).toStrictEqual({
      action: "delete",
      dstPath: docPath,
    });
  });

  it("should return finished logic result to decrement comment count document", async () => {
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

  it("should return finished logic result to delete notification document", async () => {
    const notifDocPath = `users/${postAuthorId}/notifications/${commentId}`;
    const result = await onCommentDeleteLogic.logicFn(action);

    expect(result.documents[2]).toStrictEqual({
      action: "delete",
      dstPath: notifDocPath,
    });
  });
});
