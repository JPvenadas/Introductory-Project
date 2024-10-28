import {Action, EventContext} from "emberflow/lib/types";
import {UserView} from "../../src/types";
import {initTestEmberflow} from "../init-test-emberflow";
import {admin} from "emberflow/lib";
import {
  onReplyUpdateLogic,
} from "../../src/business-logics/reply-logics";

initTestEmberflow();

const userId = "userId";
const user: UserView = {
  "@id": userId,
  "avatarUrl": `users/${userId}/profile-picture.jpeg`,
  "firstName": "Sample",
  "lastName": "User",
};

const postId = "postId";
const commentId = "commentId";

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
