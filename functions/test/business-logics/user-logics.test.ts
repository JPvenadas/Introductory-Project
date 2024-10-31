import {admin} from "emberflow/lib";
import {UserView} from "../../src/types";
import {initTestEmberflow} from "../init-test-emberflow";
import {onUserUpdateLogic} from "../../src/business-logics/user-logics";
import {Action, EventContext} from "emberflow/lib/types";
import * as utils from "../../src/business-logics/utils";

initTestEmberflow();

const userId = "userId";
const user: UserView = {
  "@id": userId,
  "avatarUrl": `users/${userId}/profile-picture.jpeg`,
  "firstName": "Sample",
  "lastName": "User",
};

describe("onUserUpdateLogic", () => {
  const modifiedFields = {
    firstName: "John",
    lastName: "Doe",
    birthDate: "2000-01-01",
  };
  const docPath = `users/${userId}`;
  const eventContext = {
    uid: userId,
    docPath: docPath,
    docId: userId,
  } as EventContext;
  const action: Action = {
    actionType: "update",
    eventContext: eventContext,
    user: user,
    modifiedFields: modifiedFields,
    document: user,
    status: "new",
    timeCreated: admin.firestore.Timestamp.now(),
  };

  let getFileDataFromUrlSpy: jest.SpyInstance;
  let moveStorageFileSpy: jest.SpyInstance;

  beforeEach(() => {
    getFileDataFromUrlSpy = jest.spyOn(utils, "getFileDataFromUrl")
      .mockReturnValue({
        filename: "sample-image",
        fileExtension: "jpeg",
      });
    moveStorageFileSpy = jest.spyOn(utils, "moveStorageFile")
      .mockResolvedValue();
  });

  it("should return finished logic result with 1 document", async () => {
    const result = await onUserUpdateLogic.logicFn(action);

    expect(result.name).toEqual("onUserUpdateLogic");
    expect(result.status).toEqual("finished");
    expect(result.documents.length).toBe(1);
  });

  it("should return finished logic result to update user document",
    async () => {
      const result = await onUserUpdateLogic.logicFn(action);
      expect(result.documents[0]).toStrictEqual({
        action: "merge",
        dstPath: docPath,
        doc: modifiedFields,
      });
    });

  it("should return finished logic result to update avatarUrl",
    async () => {
      const avatarUrl = "temp/sample-image.jpeg";
      const modifiedFieldsWithAvatar = {
        ...modifiedFields,
        avatarUrl: avatarUrl,
      };

      const newAction: Action = {
        ...action,
        modifiedFields: modifiedFieldsWithAvatar,
      };

      const fileDstPath = `users/${userId}/profile-pictures/${userId}.jpeg`;
      const expectedUserDoc = {
        ...modifiedFields,
        avatarUrl: fileDstPath,
      };

      const result = await onUserUpdateLogic.logicFn(newAction);

      expect(getFileDataFromUrlSpy).toHaveBeenCalledTimes(1);
      expect(moveStorageFileSpy).toHaveBeenCalledTimes(1);
      expect(getFileDataFromUrlSpy).toHaveBeenCalledWith(avatarUrl);
      expect(moveStorageFileSpy).toHaveBeenCalledWith(avatarUrl, fileDstPath);
      expect(result.documents[0]).toStrictEqual({
        action: "merge",
        dstPath: docPath,
        doc: expectedUserDoc,
      });
    });
});
