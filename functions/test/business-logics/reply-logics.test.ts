import {Action, EventContext} from "emberflow/lib/types";
import {UserView, Comment, PostView} from "../../src/types";
import {initTestEmberflow} from "../init-test-emberflow";
import {admin, db} from "emberflow/lib";
import {onReplyUpdateLogic, onReplyCreateLogic} from "../../src/business-logics/reply-logics";
import {DocumentData, DocumentReference} from "firebase-admin/firestore";
import {firestore} from "firebase-admin";

initTestEmberflow();

const userId = "userId";
const user: UserView = {
  "@id": userId,
  "avatarUrl": `users/${userId}/profile-picture.jpeg`,
  "firstName": "Sample",
  "lastName": "User",
};

const postId = "postId";
const post: PostView = {
  "@id": postId,
  "createdBy": user,
  "createdAt": admin.firestore.Timestamp.now().toDate(),
};

const commentId = "commentId";
const comment: Comment = {
  "@id": commentId,
  "content": "Hello, World!",
  "createdBy": user,
  "createdAt": admin.firestore.Timestamp.now().toDate(),
  "repliesCount": 0,
  "post": post,
};

describe("onReplyCreateLogic", () => {
  const replyId = "replyId";
  const docPath = `posts/${postId}/comments/${commentId}/replies/${replyId}`;
  const eventContext = {
    uid: userId,
    docPath: docPath,
    docId: replyId,
  } as EventContext;
  const modifiedFields = {
    content: "Hello, World!",
  };
  const action: Action = {
    actionType: "create",
    eventContext: eventContext,
    user: user,
    modifiedFields: modifiedFields,
    document: {},
    status: "new",
    timeCreated: expect.any(admin.firestore.Timestamp),
  };
  const expectedReplyDoc = {
    "@id": replyId,
    "content": "Hello, World!",
    "createdBy": user,
    "createdAt": expect.any(admin.firestore.Timestamp),
  };

  beforeEach(() => {
    jest.spyOn(admin.firestore.Timestamp, "now").mockReturnValue({
      toDate: () => expect.any(admin.firestore.Timestamp),
    } as firestore.Timestamp);

    jest.spyOn(db, "doc").mockImplementation((docPath) => {
      const path = docPath.split("/");
      const commentDocPathId = path[3];

      if (docPath === "invalid/docpath") {
        return {
          parent: {
            parent: null,
          },
        } as unknown as DocumentReference<DocumentData>;
      }

      if (commentDocPathId === "nonExistentCommentId") {
        return {
          get: jest.fn().mockResolvedValue({data: () => null}),
          parent: {
            parent: {
              path: `posts/${postId}/comments/${commentDocPathId}`,
            },
          },
        } as unknown as DocumentReference<DocumentData>;
      }

      return {
        path: path.slice(0, 4).join("/"),
        get: jest.fn().mockResolvedValue({
          data: () => comment,
        }),
        parent: {
          parent: {
            path: `posts/${postId}/comments/${commentDocPathId}`,
          },
        },
      } as unknown as DocumentReference<DocumentData>;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return error error logic result if comment docpath is invalid", async () => {
    const invalidDocPath = "invalid/docpath";
    const result = await onReplyCreateLogic.logicFn({
      ...action,
      eventContext: {
        ...eventContext,
        docPath: invalidDocPath,
      },
    });

    expect(result.name).toEqual("onReplyCreateLogic");
    expect(result.status).toEqual("error");
    expect(result.documents.length).toBe(0);
    expect(result.message).toContain("Invalid comment docpath");
  });

  it("should return error logic result if comment does not exist", async () => {
    const commentId = "nonExistentCommentId";
    const modifiedAction = {
      ...action,
      eventContext: {
        ...eventContext,
        docPath: `posts/${postId}/comments/${commentId}/replies/${replyId}`,
      },
    };

    const result = await onReplyCreateLogic.logicFn(modifiedAction);

    expect(result.name).toEqual("onReplyCreateLogic");
    expect(result.status).toEqual("error");
    expect(result.documents.length).toBe(0);
    expect(result.message).toContain("does not exist");
  });

  it("should return finished logic result with 3 documents", async () => {
    const result = await onReplyCreateLogic.logicFn(action);

    expect(result.name).toEqual("onReplyCreateLogic");
    expect(result.status).toEqual("finished");
    expect(result.documents.length).toBe(3);
  });

  it("should return finished logic result to create reply document", async () => {
    const result = await onReplyCreateLogic.logicFn(action);

    expect(result.documents[0]).toStrictEqual({
      action: "create",
      dstPath: docPath,
      doc: expectedReplyDoc,
    });
  });

  it("should return finished logic result to increment comment count document", async () => {
    const result = await onReplyCreateLogic.logicFn(action);

    expect(result.documents[1]).toStrictEqual({
      action: "merge",
      dstPath: `posts/${postId}/comments/${commentId}`,
      instructions: {
        repliesCount: "++",
      },
    });
  });

  it("should return finished logic result to create notification document", async () => {
    const result = await onReplyCreateLogic.logicFn(action);
    const notifDocPath = `users/${userId}/notifications/${replyId}`;

    expect(result.documents[2]).toStrictEqual({
      action: "create",
      dstPath: notifDocPath,
      doc: {
        "@id": replyId,
        "createdBy": user,
        "createdAt": expect.any(admin.firestore.Timestamp),
        "read": false,
        "type": "reply",
        "post": post,
      },
    });
  });
});


describe("onReplyUpdateLogic", () => {
  const replyId = "replyId";
  const modifiedFields = {
    content: "Hello, World!",
  };

  const document= {
    content: "Hi, World!",
  };
  const docPath = `posts/${postId}/comments/${commentId}/replies/${replyId}`;
  const eventContext = {
    uid: userId,
    docPath: docPath,
    docId: replyId,
  } as EventContext;

  const action: Action = {
    actionType: "create",
    eventContext: eventContext,
    modifiedFields: modifiedFields,
    document: document,
    user: user,
    status: "new",
    timeCreated: admin.firestore.Timestamp.now(),
  };

  it("should return finished logic result with 1 document", async () => {
    const result = await onReplyUpdateLogic.logicFn(action);

    expect(result.name).toEqual("onReplyUpdateLogic");
    expect(result.status).toEqual("finished");
    expect(result.documents.length).toBe(1);
  });

  it("should return finished logic result with updated reply content",
    async () => {
      const result = await onReplyUpdateLogic.logicFn(action);
      expect(result.documents[0]).toStrictEqual({
        action: "merge",
        dstPath: docPath,
        doc: {
          content: modifiedFields.content,
        },
      });
    });
});
