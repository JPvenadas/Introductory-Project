import {initTestEmberflow} from "../init-test-emberflow";
import {UserView} from "../../src/types";
import {Action, EventContext} from "emberflow/lib/types";
import {admin} from "emberflow/lib";
import {firestore} from "firebase-admin";
import Timestamp = firestore.Timestamp;
import {
  onPostCreateLogic,
  onPostUpdateLogic,
  onPostDeleteLogic,
} from "../../src/business-logics/post-logics";
import * as utils from "../../src/business-logics/utils";

initTestEmberflow();

// Sample User
const userId = "userId";
const user: UserView = {
  "@id": userId,
  "avatarUrl": `users/${userId}/profile-picture.jpeg`,
  "firstName": "Sample",
  "lastName": "User",
};

describe("onPostCreateLogic", () => {
  const modifiedFields = {
    content: "Hello World",
  };
  const postId = "postId";
  const docPath = `posts/${postId}`;
  const eventContext = {
    uid: userId,
    docPath: docPath,
    docId: postId,
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
  const expectedPostDoc = {
    "@id": postId,
    "content": "Hello World",
    "createdBy": user,
    "likesCount": 0,
    "commentsCount": 0,
    "sharesCount": 0,
    "createdAt": expect.any(Timestamp),
  };

  let getFileDataFromUrlSpy: jest.SpyInstance;
  let getFileMetadataSpy: jest.SpyInstance;
  let moveStorageFileSpy: jest.SpyInstance;
  let getFileTypeSpy: jest.SpyInstance;
  beforeEach(() => {
    getFileDataFromUrlSpy = jest.spyOn(utils, "getFileDataFromUrl")
      .mockReturnValue({
        filename: "sample-image",
        fileExtension: "jpeg",
      });
    getFileMetadataSpy = jest.spyOn(utils, "getFileMetadata")
      .mockResolvedValue({
        mimeType: "image/jpeg",
        size: 1000,
        updated: "2020-01-01",
      });
    moveStorageFileSpy = jest.spyOn(utils, "moveStorageFile")
      .mockResolvedValue();
    getFileTypeSpy = jest.spyOn(utils, "getFileType")
      .mockReturnValue("image");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return finished logic result with 2 documents", async () => {
    const result = await onPostCreateLogic.logicFn(action);

    expect(result.name).toEqual("onPostCreateLogic");
    expect(result.status).toEqual("finished");
    expect(result.documents.length).toBe(2);
  });

  it("should return finished logic result to create post document",
    async () => {
      const result = await onPostCreateLogic.logicFn(action);

      expect(result.documents[0]).toStrictEqual({
        action: "create",
        dstPath: docPath,
        doc: expectedPostDoc,
      });
    });

  it("should return finished logic result to create timeline document",
    async () => {
      const result = await onPostCreateLogic.logicFn(action);

      const timelineDocPath = `users/${userId}/timeline/${postId}`;
      expect(result.documents[1]).toStrictEqual({
        action: "create",
        dstPath: timelineDocPath,
        doc: expectedPostDoc,
      });
    });

  it("should return finished logic result to create post document with file",
    async () => {
      const fileUrl = "temp/sample-image.jpeg";
      const newModifiedFields = {
        ...modifiedFields,
        fileUrl: fileUrl,
      };
      const newAction: Action = {
        ...action,
        modifiedFields: newModifiedFields,
      };
      const fileDstPath = `posts/${postId}/${postId}.jpeg`;
      const newExpectedPostDoc = {
        ...expectedPostDoc,
        file: {
          fileName: "sample-image",
          url: fileDstPath,
          size: 1000,
          mimeType: "image/jpeg",
          type: "image",
        },
      };
      const result = await onPostCreateLogic.logicFn(newAction);

      expect(getFileDataFromUrlSpy).toHaveBeenCalledTimes(1);
      expect(getFileMetadataSpy).toHaveBeenCalledTimes(1);
      expect(moveStorageFileSpy).toHaveBeenCalledTimes(1);
      expect(getFileTypeSpy).toHaveBeenCalledTimes(1);

      expect(getFileDataFromUrlSpy).toHaveBeenCalledWith(fileUrl);
      expect(getFileMetadataSpy).toHaveBeenCalledWith(fileUrl);
      expect(moveStorageFileSpy).toHaveBeenCalledWith(fileUrl, fileDstPath);
      expect(getFileTypeSpy).toHaveBeenCalledWith("image/jpeg");

      expect(result.documents[0].doc).toStrictEqual(newExpectedPostDoc);
      expect(result.documents[1].doc).toStrictEqual(newExpectedPostDoc);
    });
});

describe("onPostUpdateLogic", () => {
  const postId = "postId";
  const modifiedFields = {
    content: "Hi World",
  };
  const fileUrl = `posts/${postId}/${postId}.jpeg`;
  const document = {
    content: "Hello World",
    file: {
      fileName: "sample-image",
      url: fileUrl,
      size: 1000,
      mimeType: "image/jpeg",
      type: "image",
    },
  };
  const docPath = `posts/${postId}`;
  const eventContext = {
    uid: userId,
    docPath: docPath,
    docId: postId,
  } as EventContext;
  const action: Action = {
    actionType: "create",
    eventContext: eventContext,
    user: user,
    document: document,
    status: "new",
    timeCreated: admin.firestore.Timestamp.now(),
    modifiedFields: modifiedFields,
  };

  let getFileDataFromUrlSpy: jest.SpyInstance;
  let getFileMetadataSpy: jest.SpyInstance;
  let moveStorageFileSpy: jest.SpyInstance;
  let getFileTypeSpy: jest.SpyInstance;
  let deleteStorageFileSpy: jest.SpyInstance;
  beforeEach(() => {
    getFileDataFromUrlSpy = jest.spyOn(utils, "getFileDataFromUrl")
      .mockReturnValue({
        filename: "sample-image",
        fileExtension: "jpeg",
      });
    getFileMetadataSpy = jest.spyOn(utils, "getFileMetadata")
      .mockResolvedValue({
        mimeType: "image/jpeg",
        size: 1000,
        updated: "2020-01-01",
      });
    moveStorageFileSpy = jest.spyOn(utils, "moveStorageFile")
      .mockResolvedValue();
    getFileTypeSpy = jest.spyOn(utils, "getFileType")
      .mockReturnValue("image");
    deleteStorageFileSpy = jest.spyOn(utils, "deleteStorageFile")
      .mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return finished logic result with 1 document", async () => {
    const result = await onPostUpdateLogic.logicFn(action);

    expect(result.name).toEqual("onPostUpdateLogic");
    expect(result.status).toEqual("finished");
    expect(result.documents.length).toBe(1);
  });

  it("should return finished logic result to update post document",
    async () => {
      const result = await onPostUpdateLogic.logicFn(action);

      expect(result.documents[0]).toStrictEqual({
        action: "merge",
        dstPath: docPath,
        doc: {
          content: "Hi World",
        },
      });
    });

  it("should return finished logic result to update post document with file",
    async () => {
      const fileUrl = "temp/sample-image.jpeg";
      const newModifiedFields = {
        ...modifiedFields,
        fileUrl: fileUrl,
      };
      const newAction: Action = {
        ...action,
        modifiedFields: newModifiedFields,
      };
      const fileDstPath = `posts/${postId}/${postId}.jpeg`;
      const newExpectedPostDoc = {
        content: "Hi World",
        file: {
          fileName: "sample-image",
          url: fileDstPath,
          size: 1000,
          mimeType: "image/jpeg",
          type: "image",
        },
      };
      const result = await onPostUpdateLogic.logicFn(newAction);

      expect(getFileDataFromUrlSpy).toHaveBeenCalledTimes(1);
      expect(getFileMetadataSpy).toHaveBeenCalledTimes(2);
      expect(deleteStorageFileSpy).not.toHaveBeenCalled();
      expect(moveStorageFileSpy).toHaveBeenCalledTimes(1);
      expect(getFileTypeSpy).toHaveBeenCalledTimes(1);

      expect(getFileDataFromUrlSpy).toHaveBeenCalledWith(fileUrl);
      expect(getFileMetadataSpy).toHaveBeenCalledWith(fileUrl);
      expect(moveStorageFileSpy).toHaveBeenCalledWith(fileUrl, fileDstPath);
      expect(getFileTypeSpy).toHaveBeenCalledWith("image/jpeg");

      expect(result.documents[0].doc).toStrictEqual(newExpectedPostDoc);
    });

  it("should delete old file when post is updated with a different file type",
    async () => {
      getFileDataFromUrlSpy.mockReturnValueOnce({
        filename: "new-image",
        fileExtension: "png",
      });
      getFileMetadataSpy.mockResolvedValueOnce({
        mimeType: "image/png",
        size: 1000,
        updated: "2020-01-01",
      }).mockResolvedValueOnce({
        mimeType: "image/jpeg",
        size: 1000,
        updated: "2020-01-01",
      });
      const newFileUrl = "temp/new-image.png";
      const newModifiedFields = {
        ...modifiedFields,
        fileUrl: newFileUrl,
      };
      const newAction: Action = {
        ...action,
        modifiedFields: newModifiedFields,
      };
      const fileDstPath = `posts/${postId}/${postId}.png`;
      const newExpectedPostDoc = {
        content: "Hi World",
        file: {
          fileName: "new-image",
          url: fileDstPath,
          size: 1000,
          mimeType: "image/png",
          type: "image",
        },
      };
      const result = await onPostUpdateLogic.logicFn(newAction);

      expect(getFileDataFromUrlSpy).toHaveBeenCalledTimes(1);
      expect(getFileMetadataSpy).toHaveBeenCalledTimes(2);
      expect(deleteStorageFileSpy).toHaveBeenCalledTimes(1);
      expect(moveStorageFileSpy).toHaveBeenCalledTimes(1);
      expect(getFileTypeSpy).toHaveBeenCalledTimes(1);

      expect(getFileDataFromUrlSpy).toHaveBeenCalledWith(newFileUrl);
      expect(getFileMetadataSpy).toHaveBeenCalledWith(newFileUrl);
      expect(getFileMetadataSpy).toHaveBeenCalledWith(fileUrl);
      expect(deleteStorageFileSpy).toHaveBeenCalledWith(fileUrl);
      expect(moveStorageFileSpy).toHaveBeenCalledWith(newFileUrl, fileDstPath);
      expect(getFileTypeSpy).toHaveBeenCalledWith("image/png");

      expect(result.documents[0].doc).toStrictEqual(newExpectedPostDoc);
    });
});

describe("onPostDeleteLogic", () => {
  const postId = "postId";
  const docPath = `posts/${postId}`;
  const eventContext = {
    uid: userId,
    docPath: docPath,
    docId: postId,
  } as EventContext;
  const action: Action = {
    actionType: "create",
    eventContext: eventContext,
    user: user,
    document: {content: "Hello World"},
    status: "new",
    timeCreated: admin.firestore.Timestamp.now(),
    modifiedFields: {},
  };

  let deleteStorageFileSpy: jest.SpyInstance;
  beforeEach(() => {
    deleteStorageFileSpy = jest.spyOn(utils, "deleteStorageFile")
      .mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return finished logic result with 2 documents", async () => {
    const result = await onPostDeleteLogic.logicFn(action);

    expect(result.name).toEqual("onPostDeleteLogic");
    expect(result.status).toEqual("finished");
    expect(result.documents.length).toBe(2);
  });

  it("should return finished logic result to delete post document",
    async () => {
      const result = await onPostDeleteLogic.logicFn(action);

      expect(result.documents[0]).toStrictEqual({
        action: "delete",
        dstPath: docPath,
      });
    });

  it("should return finished logic result to delete timeline document",
    async () => {
      const timelineDocPath = `users/${userId}/timeline/${postId}`;
      const result = await onPostDeleteLogic.logicFn(action);

      expect(result.documents[1]).toStrictEqual({
        action: "delete",
        dstPath: timelineDocPath,
      });
    });

  it("should return finished logic result to delete post document with " +
    "file", async () => {
    const fileUrl = `posts/${postId}/${postId}.jpeg`;
    const newAction: Action = {
      ...action,
      document: {
        file: {
          fileName: "sample-image",
          url: fileUrl,
          size: 1000,
          mimeType: "image/jpeg",
          type: "image",
        },
      },
    };
    const result = await onPostDeleteLogic.logicFn(newAction);

    expect(deleteStorageFileSpy).toHaveBeenCalledTimes(1);
    expect(deleteStorageFileSpy).toHaveBeenCalledWith(fileUrl);

    expect(result.documents[0]).toStrictEqual({
      action: "delete",
      dstPath: docPath,
    });
    expect(result.documents[1]).toStrictEqual({
      action: "delete",
      dstPath: `users/${userId}/timeline/${postId}`,
    });
  });
});
