import {Action, EventContext} from "emberflow/lib/types";
import {initTestEmberflow} from "../init-test-emberflow";
import {User} from "../../src/types";
import {admin} from "emberflow/lib";
import {
  onUserUpdateLogic,
} from "../../src/business-logics/user-logics";
import * as utils from "../../src/business-logics/utils";

initTestEmberflow();


const user: User = {
  "@id": "userId",
  "username": "testuser",
  "firstName": "Test",
  "lastName": "User",
  "avatarUrl": "https://example.com/avatar.jpg",
  "birthDate": new Date(),
};

describe("onUserUpdateLogic", () => {
  const modifiedFields = {
    "username": "changeduser",
    "firstName": "Changed",
    "lastName": "User",
    "avatarUrl": "https://example.com/changedAvatar.jpg",
    "birthDate": new Date(),
  };

  const eventContext: EventContext = {
    docPath: `users/${user["@id"]}`,
    docId: "userId",
    uid: "userId",
  } as EventContext;

  const action: Action = {
    eventContext: eventContext,
    actionType: "create",
    modifiedFields: modifiedFields,
    document: user,
    status: "new",
    user: user,
    timeCreated: expect.any(admin.firestore.Timestamp),
  } as Action;

  beforeEach(() => {
    jest.spyOn(utils, "getFileDataFromUrl").mockImplementation((url) => {
      if (url === modifiedFields.avatarUrl) {
        return {
          filename: "avatar",
          fileExtension: "jpg",
        };
      } else {
        return {
          filename: "changedAvatar",
          fileExtension: "jpg",
        };
      }
    });

    jest.spyOn(utils, "deleteStorageFile").mockResolvedValue();
    jest.spyOn(utils, "moveStorageFile").mockResolvedValue();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 1 document", async () => {
    const result = await onUserUpdateLogic.logicFn(action);
    expect(result.documents.length).toBe(1);
  });

  it("should return the updated user document", async () => {
    const result = await onUserUpdateLogic.logicFn(action);
    expect(result.documents[0].doc).toStrictEqual(modifiedFields);
  });
});

