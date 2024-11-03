import {initTestEmberflow} from "../init-test-emberflow";
import {PostView, UserView} from "../../src/types";
import {Action, EventContext} from "emberflow/lib/types";
import {admin, db} from "emberflow/lib";
import {firestore} from "firebase-admin";
import {onShareLogic} from "../../src/business-logics/share-logics";

initTestEmberflow();

const userView: UserView = {
  "@id": "user",
  "firstName": "John",
  "lastName": "Doe",
};

const post: PostView = {
  "@id": "post",
  "createdAt": expect.any(admin.firestore.Timestamp),
  "createdBy": userView,
};


describe("onShareLogic", () => {
  const shareId = "shareId";
  const postPath = `posts/${post["@id"]}`;
  const docPath = `posts/${post["@id"]}/shares/${userView["@id"]}`;
  const eventContext: EventContext = {
    docId: shareId,
    docPath: docPath,
    uid: userView["@id"],

  } as EventContext;

  const action: Action = {
    actionType: "create",
    document: {},
    eventContext: eventContext,
    modifiedFields: {},
    status: "new",
    timeCreated: expect.any(admin.firestore.Timestamp),
    user: userView,
  } as Action;

  beforeEach(() => {
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
  it("should return 3 documents", async () => {
    const result = await onShareLogic.logicFn(action);
    expect(result.documents.length).toEqual(3);
  });

  it("should return 1 document with action copy", async () => {
    const result = await onShareLogic.logicFn(action);
    expect(result.documents[0].action).toEqual("copy");
    expect(result.documents[0].dstPath)
      .toEqual(`users/${userView["@id"]}/timeline/${post["@id"]}`);
    expect(result.documents[0].srcPath).toEqual(postPath);
  });

  it("should return 1 document with action create", async () => {
    const result = await onShareLogic.logicFn(action);
    expect(result.documents[1].action).toEqual("create");
    expect(result.documents[1].dstPath).toEqual(docPath);
    expect(result.documents[1].instructions)
      .toEqual({sharesCount: "++"});
  });

  it("should return 1 document with action create", async () => {
    const result = await onShareLogic.logicFn(action);
    expect(result.documents[2].action).toEqual("create");
    expect(result.documents[2].dstPath)
      .toEqual(`users/${post.createdBy["@id"]}/notifications/${post["@id"]}`);
  });
});
