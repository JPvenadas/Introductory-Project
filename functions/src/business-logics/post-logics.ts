import {admin} from "emberflow/lib";
import {LogicConfig, LogicResultDoc} from "emberflow/lib/types";
import {
  createUserView,
  deleteStorageFile,
  getFileDataFromUrl,
  getFileMetadata,
  getFileType,
  moveStorageFile,
} from "./utils";
import {UserView, File} from "../types";
import {firestore} from "firebase-admin";
import DocumentData = firestore.DocumentData;
import {Entity} from "../db-structure";

export const onPostCreateLogic: LogicConfig = {
  name: "onPostCreateLogic",
  actionTypes: ["create"],
  modifiedFields: "all",
  entities: [Entity.Post],
  logicFn: async (action) => {
    const {
      eventContext: {
        docPath,
        docId,
        uid,
      },
      user,
      modifiedFields,
    } = action;

    // Create user view
    const userView: UserView = createUserView(user);

    // Create post document
    const now = admin.firestore.Timestamp.now();
    const {fileUrl, ...fields} = modifiedFields;
    const postDoc: DocumentData = {
      ...fields,
      "@id": docId,
      "createdBy": userView,
      "createdAt": now,
      "likesCount": 0,
      "commentsCount": 0,
      "sharesCount": 0,
    };

    if (fileUrl) {
      // Transfer file location
      const {filename, fileExtension} = getFileDataFromUrl(fileUrl);
      const {mimeType, size} = await getFileMetadata(fileUrl);
      const fileDstPath =
        `posts/${docId}/${docId}.${fileExtension}`;
      await moveStorageFile(fileUrl, fileDstPath);

      // Add file to post document
      const file: File = {
        fileName: filename,
        url: fileDstPath,
        size: size,
        mimeType: mimeType,
        type: getFileType(mimeType),
      };
      postDoc["file"] = file;
    }

    // Create post logic result
    const postLogicResultDoc: LogicResultDoc = {
      "action": "create",
      "dstPath": docPath,
      "doc": postDoc,
    };

    // Copy post to user timeline
    const timelineDocPath = `users/${uid}/timeline/${docId}`;
    const timelineLogicResultDoc: LogicResultDoc = {
      "action": "create",
      "dstPath": timelineDocPath,
      "doc": postDoc,
    };

    // Create logic result documents
    const logicResultDocs: LogicResultDoc[] = [];
    logicResultDocs.push(postLogicResultDoc);
    logicResultDocs.push(timelineLogicResultDoc);

    // Return the result of the logic function
    return {
      name: "onPostCreateLogic",
      status: "finished",
      documents: logicResultDocs,
    };
  },
};

export const onPostUpdateLogic: LogicConfig = {
  name: "onPostCreateLogic",
  actionTypes: ["update"],
  modifiedFields: "all",
  entities: [Entity.Post],
  logicFn: async (action) => {
    const {
      eventContext: {
        docPath,
        docId,
      },
      modifiedFields,
      document,
    } = action;

    // Update post document
    const {fileUrl, ...fields} = modifiedFields;
    const postDoc: DocumentData = {
      ...fields,
    };

    if (fileUrl) {
      const {filename, fileExtension} = getFileDataFromUrl(fileUrl);
      const {mimeType, size} = await getFileMetadata(fileUrl);

      const {file: oldFile} = document;
      // Check if file type changed
      if (oldFile) {
        const oldFileUrl = oldFile["url"];
        const {mimeType: oldMimeType} = await getFileMetadata(oldFileUrl);
        if (mimeType !== oldMimeType) {
          // Delete old file
          await deleteStorageFile(oldFileUrl);
        }
      }

      // Transfer file location
      const fileDstPath =
        `posts/${docId}/${docId}.${fileExtension}`;
      await moveStorageFile(fileUrl, fileDstPath);

      // Add file to post document
      const file: File = {
        fileName: filename,
        url: fileDstPath,
        size: size,
        mimeType: mimeType,
        type: getFileType(mimeType),
      };
      postDoc["file"] = file;
    }

    // Create post logic result
    const postLogicResultDoc: LogicResultDoc = {
      "action": "merge",
      "dstPath": docPath,
      "doc": postDoc,
    };

    // Create logic result documents
    const logicResultDocs: LogicResultDoc[] = [];
    logicResultDocs.push(postLogicResultDoc);

    // Return the result of the logic function
    return {
      name: "onPostUpdateLogic",
      status: "finished",
      documents: logicResultDocs,
    };
  },
};

export const onPostDeleteLogic: LogicConfig = {
  name: "onPostDeleteLogic",
  actionTypes: ["delete"],
  modifiedFields: "all",
  entities: [Entity.Post],
  logicFn: async (action) => {
    const {
      eventContext: {
        docPath,
        uid,
        docId,
      },
      document,
    } = action;

    // Delete file
    const {file} = document;
    if (file) {
      const fileUrl = file["url"];
      await deleteStorageFile(fileUrl);
    }

    // Create post logic result
    const postLogicResultDoc: LogicResultDoc = {
      "action": "delete",
      "dstPath": docPath,
    };

    // Create post logic result
    const timelineDocPath = `users/${uid}/timeline/${docId}`;
    const timelineLogicResultDoc: LogicResultDoc = {
      "action": "delete",
      "dstPath": timelineDocPath,
    };

    // Create logic result documents
    const logicResultDocs: LogicResultDoc[] = [];
    logicResultDocs.push(postLogicResultDoc);
    logicResultDocs.push(timelineLogicResultDoc);

    // Return the result of the logic function
    return {
      name: "onPostDeleteLogic",
      status: "finished",
      documents: logicResultDocs,
    };
  },
};
