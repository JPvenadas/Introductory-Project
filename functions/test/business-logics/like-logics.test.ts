import {admin, db} from "emberflow/lib";
import {PostView, UserView} from "../../src/types";
import {initTestEmberflow} from "../init-test-emberflow";
import {Action, EventContext, LogicResultDoc} from "emberflow/lib/types";
import {DocumentData, DocumentReference} from "firebase-admin/firestore";
import {onUnlikeLogic} from "../../src/business-logics/like-logics";

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
              data: () => postDocId === postId ? post : null,
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

  it("should return finished logic result to decrement post likes document",
    async () => {
      const result = await onUnlikeLogic.logicFn(action);
      expect(result.documents[0]).toStrictEqual(expectedPostLogicResultDoc);
    });
  it("should return finished logic result to delete the userView from post document",
    async () => {
      const result = await onUnlikeLogic.logicFn(action);
      expect(result.documents[1]).toStrictEqual(expectedLikeLogicResultDoc);
    });

  it("should return finished logic result to delete the notification document",
    async () => {
      const result = await onUnlikeLogic.logicFn(action);
      expect(result.documents[2]).toStrictEqual(expectedNotificationLogicResultDoc);
    });
});
