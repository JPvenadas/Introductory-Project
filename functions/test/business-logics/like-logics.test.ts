import { admin, db } from "emberflow/lib";
import { PostView, UserView } from "../../src/types";
import { initTestEmberflow } from "../init-test-emberflow";
import { Action, EventContext } from "emberflow/lib/types";
import { firestore } from "firebase-admin";
import { DocumentData, DocumentReference } from "firebase-admin/firestore";
import { onLikeLogic } from "../../src/business-logics/like-logics";

initTestEmberflow();

const userId = "userId";
const user: UserView = {
  "@id": userId,
  avatarUrl: `users/${userId}/profile-picture.jpeg`,
  firstName: "Sample",
  lastName: "User",
};

const postId = "postId";
const post: PostView = {
  "@id": postId,
  createdBy: user,
  createdAt: admin.firestore.Timestamp.now().toDate(),
};

describe("onLikeLogic", () => {
  const docId = "docId";
  const docPath = `posts/${postId}/likes/${docId}`;
  const eventContext = {
    uid: userId,
    docPath: docPath,
    docId: docId,
  } as EventContext;
  const action: Action = {
    actionType: "create",
    eventContext: eventContext,
    user: user,
    modifiedFields: {},
    document: {},
    status: "new",
    timeCreated: admin.firestore.Timestamp.now(),
  };
  const expectedLikeDoc = { ...user };

  beforeEach(() => {
    jest.spyOn(admin.firestore.Timestamp, "now").mockReturnValue({
      toDate: () => expect.any(admin.firestore.Timestamp),
    } as firestore.Timestamp);

    jest.spyOn(db, "doc").mockImplementation((docPath) => {
      const path = docPath.split("/");
      const postDocId = path[1];

      if (path.length < 4) {
        return {
          parent: {
            parent: null,
          },
        } as unknown as DocumentReference<DocumentData>;
      }

      return {
        parent: {
          parent: {
            path: `posts/${postId}`,
            get: jest.fn().mockResolvedValue({
              data: () => (postDocId === postId ? post : null),
            }),
          },
        },
      } as unknown as DocumentReference<DocumentData>;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return return error logic result if post docpath is invalid", async () => {
    const invalidDocPath = "invalid/docpath";
    const result = await onLikeLogic.logicFn({
      ...action,
      eventContext: {
        ...eventContext,
        docPath: invalidDocPath,
      },
    });

    expect(result.name).toEqual("onLikeLogic");
    expect(result.status).toEqual("error");
    expect(result.documents.length).toBe(0);
    expect(result.message).toContain("Invalid post docpath");
  });

  it("should return error logic result if post does not exist", async () => {
    const nonExistentDocId = "nonExistentDocId";
    const result = await onLikeLogic.logicFn({
      ...action,
      eventContext: {
        ...eventContext,
        docPath: `posts/${nonExistentDocId}/likes/${docId}`,
      },
    });

    expect(result.name).toEqual("onLikeLogic");
    expect(result.status).toEqual("error");
    expect(result.documents.length).toBe(0);
    expect(result.message).toContain("does not exist");
  });

  it("should return finished logic result with 3 documents", async () => {
    const result = await onLikeLogic.logicFn(action);

    expect(result.name).toEqual("onLikeLogic");
    expect(result.status).toEqual("finished");
    expect(result.documents.length).toBe(3);
  });

  it("should return finished logic result to increment likes count document", async () => {
    const result = await onLikeLogic.logicFn(action);

    expect(result.documents[0]).toStrictEqual({
      action: "merge",
      dstPath: `posts/${postId}`,
      instructions: {
        likesCount: "++",
      },
    });
  });

  it("should return finished logic result to create like document", async () => {
    const result = await onLikeLogic.logicFn(action);

    expect(result.documents[1]).toStrictEqual({
      action: "create",
      dstPath: docPath,
      doc: expectedLikeDoc,
    });
  });

  it("should return finished logic result to create notification document", async () => {
    const { createdBy } = post;
    const notifDocPath = `users/${createdBy["@id"]}/notifications/${docId}`;
    const result = await onLikeLogic.logicFn(action);

    expect(result.documents[2]).toStrictEqual({
      action: "create",
      dstPath: notifDocPath,
      doc: {
        createdBy: createdBy,
        createdAt: expect.any(admin.firestore.Timestamp),
        type: "like",
        post: post,
      },
    });
  });
});
describe("onUnlikeLogic", () => {
  const docId = "likeId";
  const eventContext: EventContext = {
    uid: userId,
    docPath: `posts/${postId}/likes/${docId}`,
    docId: docId,
  } as EventContext;
  const action: Action = {
    eventContext: eventContext,
    actionType: "create",
    modifiedFields: {},
    user: user,
    document: {},
    status: "new",
    timeCreated: admin.firestore.Timestamp.now(),
  } as Action;

  const expectedPostLogicResultDoc: LogicResultDoc = {
    action: "merge",
    dstPath: `posts/${postId}`,
    instructions: {
      likesCount: "--",
    },
  };

  const expectedLikeLogicResultDoc: LogicResultDoc = {
    action: "delete",
    dstPath: `posts/${postId}/likes/${docId}`,
  };

  const expectedNotificationLogicResultDoc: LogicResultDoc = {
    action: "delete",
    dstPath: `users/${userId}/notifications/${docId}`,
  };

  beforeEach(() => {
    jest.spyOn(db, "doc").mockImplementation((docPath) => {
      const path = docPath.split("/");
      const postDocId = path[1];

      if (path.length < 4) {
        return {
          parent: {
            parent: null,
          },
        } as unknown as DocumentReference<DocumentData>;
      }

      return {
        parent: {
          parent: {
            path: `posts/${postId}`,
            get: jest.fn().mockResolvedValue({
              data: () => (postDocId === postId ? post : null),
            }),
          },
        },
      } as unknown as DocumentReference<DocumentData>;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return finished logic result with 3 documents", async () => {
    const result = await onUnlikeLogic.logicFn(action);

    expect(result.name).toEqual("onUnlikeLogic");
    expect(result.status).toEqual("finished");
    expect(result.documents.length).toBe(3);
  });

  it("should return finished logic result to decrement post likes document", async () => {
    const result = await onUnlikeLogic.logicFn(action);
    expect(result.documents[0]).toStrictEqual(expectedPostLogicResultDoc);
  });
  it("should return finished logic result to delete the userView from post document", async () => {
    const result = await onUnlikeLogic.logicFn(action);
    expect(result.documents[1]).toStrictEqual(expectedLikeLogicResultDoc);
  });

  it("should return finished logic result to delete the notification document", async () => {
    const result = await onUnlikeLogic.logicFn(action);
    expect(result.documents[2]).toStrictEqual(
      expectedNotificationLogicResultDoc
    );
  });
});
