import {initTestEmberflow} from "../init-test-emberflow";
import {PostView, UserView, Notification, Post} from "../../src/types";
import {Action, EventContext} from "emberflow/lib/types";
import {admin, db} from "emberflow/lib";
import {firestore} from "firebase-admin";
import {onShareLogic} from "../../src/business-logics/share-logics";
import * as utils from "../../src/business-logics/utils";

initTestEmberflow();

const postAuthorUserView: UserView = {
  "@id": "user",
  "firstName": "John",
  "lastName": "Doe",
};


const sharerUserView: UserView = {
  "@id": "sharer",
  "firstName": "Jane",
  "lastName": "Doe",
};

const post: PostView = {
  "@id": "post",
  "createdAt": expect.any(admin.firestore.Timestamp),
  "createdBy": postAuthorUserView,
};



describe("onShareLogic", () => {
  const shareId = "shareId";
  const postPath = `posts/${post["@id"]}`;
  const docPath = `posts/${post["@id"]}/shares/${sharerUserView["@id"]}`;


  const expectedNotification: Notification ={
    "@id": shareId,
    "createdAt": expect.any(Date),
    "createdBy": sharerUserView,
    "post": post as Post,
    "read": false,
    "type": "share",
  };
  const eventContext: EventContext = {
    docId: shareId,
    docPath: docPath,
    uid: sharerUserView["@id"],
  } as EventContext;

  const action: Action = {
    actionType: "create",
    document: {},
    eventContext: eventContext,
    modifiedFields: {},
    status: "new",
    timeCreated: expect.any(admin.firestore.Timestamp),
    user: sharerUserView,
  } as Action;

  beforeEach(() => {
    jest.spyOn(utils, "createUserView").mockReturnValue(sharerUserView);

    jest.spyOn(db, "doc").mockImplementation(() => {
      return {
        parent: {
          parent: {
            path: postPath,
            get: jest.fn().mockResolvedValue({
              data: jest.fn().mockReturnValue(post),
            }),
          },
        },
      } as unknown as firestore.DocumentReference;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  it("should return 4 documents", async () => {
    const result = await onShareLogic.logicFn(action);
    expect(result.documents.length).toEqual(4);
  });

  it("should return 1 document that copies post to sharer timeline", async () => {
    const result = await onShareLogic.logicFn(action);
    expect(result.documents[0].action).toEqual("copy");
    expect(result.documents[0].dstPath)
      .toEqual(`users/${sharerUserView["@id"]}/timeline/${post["@id"]}`);
    expect(result.documents[0].srcPath).toEqual(postPath);
  });

  it("should return 1 document that increments sharesCount", async () => {
    const result = await onShareLogic.logicFn(action);
    expect(result.documents[1].action).toEqual("merge");
    expect(result.documents[1].dstPath).toEqual(postPath);
    expect(result.documents[1].instructions)
      .toEqual({sharesCount: "++"});
  });

  it("should return 1 document that creates a notification", async () => {
    const result = await onShareLogic.logicFn(action);
    expect(result.documents[2].action).toEqual("create");
    expect(result.documents[2].dstPath)
      .toEqual(`users/${post.createdBy["@id"]}/notifications/${post["@id"]}`);
    expect(result.documents[2].doc).toEqual(expectedNotification);
  });

  it("should return 1 document that adds sharerUserView to the share path",
    async () => {
      const result = await onShareLogic.logicFn(action);
      expect(result.documents[3].action).toEqual("create");
      expect(result.documents[3].dstPath).toEqual(docPath);
      expect(result.documents[3].doc).toEqual(sharerUserView);
    });
});
