// import {firestore} from "firebase-admin";
import {onCommentCreateLogic} from "../../src/business-logics/comment-logics";
import {admin} from "emberflow/lib";
import {initTestEmberflow} from "../init-test-emberflow";
import {UserView} from "../../src/types";
import {Action, EventContext} from "emberflow/lib/types";
import {firestore} from "firebase-admin";
import * as utils from "../../src/business-logics/utils";

initTestEmberflow();


const userId = "userId";
const user: UserView = {
  "@id": userId,
  "avatarUrl": `users/${userId}/profile-picture.jpeg`,
  "firstName": "Sample",
  "lastName": "User",
};

describe("onCommentCreateLogic", () => {
  const modifiedFields = {
    content: "Hello, World!",
  };
  const commentId = "commentId";
  const docPath = `posts/postId/comments/${commentId}`;
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
  let dbDocSpy: jest.SpyInstance;
  let createUserViewSpy: jest.SpyInstance;
  beforeEach(() => {
    dbDocSpy = jest.spyOn(admin.firestore(), "doc")
      .mockImplementation(() =>{
        // const dirs = docPath.split("/");

        return {
          parent: {
            parent: {
              get: jest.fn().mockResolvedValue({
                data: jest.fn().mockReturnValue({
                  "@id": "postId",
                  "createdBy": {
                    "@id": userId,
                  },
                }),
              }),
            },
          },
        } as unknown as firestore.DocumentReference;
      }
      );

    createUserViewSpy = jest.spyOn(utils, "createUserView")
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

  // const expectedPostDoc = {
  //   "@id": commentId,
  //   "content": "Hello World",
  //   "createdBy": user,
  //   "likesCount": 0,
  //   "commentsCount": 0,
  //   "sharesCount": 0,
  //   "createdAt": expect.any(Timestamp),
  // };

  it("should return finished logic result with 2 docs", async () => {
    const result = await onCommentCreateLogic.logicFn(action);
    console.log(result);


    expect(result.name).toEqual("onCommentCreateLogic");
    expect(result.status).toEqual("finished");
    expect(result.documents.length).toBe(3);
  });

  it("tests", async () => {
    await onCommentCreateLogic.logicFn(action);
    expect(dbDocSpy).toHaveBeenCalledTimes(1);
    expect(createUserViewSpy).toHaveBeenCalledTimes(1);
  });
});

