import {Action, EventContext} from "emberflow/lib/types";
import {Comment, PostView, UserView} from "../../src/types";
import {initTestEmberflow} from "../init-test-emberflow";
import {admin, db} from "emberflow/lib";
import {
  onReplyDeleteLogic,
} from "../../src/business-logics/reply-logics";
import {DocumentData, DocumentReference} from "firebase-admin/firestore";

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

describe("onReplyDeleteLogic", () => {
  const replyId = "replyId";
  const docPath = `posts/${postId}/comments/${commentId}/replies/${replyId}`;
  const eventContext: EventContext = {
    uid: userId,
    docPath: docPath,
    docId: replyId,
  } as EventContext;

  const action: Action = {
    actionType: "create",
    eventContext: eventContext,
    user: user,
    document: {
      content: "Hello World",
    },
    status: "new",
    timeCreated: admin.firestore.Timestamp.now(),
    modifiedFields: {},
  };
  beforeEach(() => {
    jest.spyOn(db, "doc").mockImplementation((docPath: string) => {
      const path = docPath.split("/");
      const commentIdPathIndex = 3;
      const commentDocPathId = path[commentIdPathIndex];

      if (docPath === "invalid/docPath") {
        return {
          parent: {
            parent: null,
          },
        } as unknown as DocumentReference<DocumentData>;
      }

      if (commentDocPathId === "nonExistentCommentId") {
        return {
          parent: {
            parent: {
              path: `posts/${postId}/comments/${commentId}`,
              get: jest.fn().mockResolvedValue({data: () => null}),
            },
          },
        } as unknown as DocumentReference<DocumentData>;
      }

      return {

        parent: {
          parent: {
            path: `posts/${postId}/comments/${commentDocPathId}`,
            get: jest.fn().mockResolvedValue({
              data: () => comment,
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
    const result = await onReplyDeleteLogic.logicFn(action);

    expect(result.name).toEqual("onReplyDeleteLogic");
    expect(result.status).toEqual("finished");
    expect(result.documents.length).toBe(3);
  });


  it("should return finished logic result to delete reply document",
    async () => {
      const result = await onReplyDeleteLogic.logicFn(action);

      expect(result.documents[0]).toStrictEqual({
        action: "delete",
        dstPath: docPath,
      });
    });
});
