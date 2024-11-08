import {Entity} from "../db-structure";
import {LogicConfig, LogicResultDoc} from "emberflow/lib/types";
import {deleteStorageFile, getFileDataFromUrl, moveStorageFile} from "./utils";
import {DocumentData} from "firebase-admin/firestore";

// TODO write onUserUpdateLogic
//  allow users to update their firstName, lastName, birthDate, and avatarUrl
//  avatarUrl must be saved to users/{uid}/profile-pictures path in storage
//  create a security fn that will prevent users from changing their username
export const onUserUpdateLogic: LogicConfig = {
  name: "onUserUpdateLogic",
  actionTypes: ["update"],
  entities: [Entity.User],
  modifiedFields: ["all"],
  logicFn: async (action) => {
    const {
      eventContext: {
        docPath,
        docId,
        uid,
      },
      modifiedFields,
      document: oldUser,
    } = action;

    const {
      avatarUrl: fileUrl,
      ...fields
    } = modifiedFields;

    const newUserDoc: DocumentData = {...fields};

    if (fileUrl) {
      const {
        // filename: newFileName,
        fileExtension: newFileExtension,
      } = getFileDataFromUrl(fileUrl);
      const {
        avatarUrl: oldFileUrl,
      } = oldUser;

      if (oldFileUrl) {
        const {
          fileExtension: oldFileExtension,
        }= getFileDataFromUrl(oldFileUrl);


        if (newFileExtension !== oldFileExtension) {
          await deleteStorageFile(oldFileUrl);
        }
      }
      const fileDstPath =
        `users/${uid}/profile-pictures/${docId}.${newFileExtension}`;
      await moveStorageFile(fileUrl, fileDstPath);

      // const {mimeType, size}= await getFileMetadata(fileUrl);
      newUserDoc["avatarUrl"] = fileUrl;
    }

    const userLogicResultDoc: LogicResultDoc = {
      action: "merge",
      dstPath: docPath,
      doc: newUserDoc,
    };

    const logicResultDocs: LogicResultDoc[] = [];
    logicResultDocs.push(userLogicResultDoc);

    return {
      name: "onUserUpdateLogic",
      status: "finished",
      documents: logicResultDocs,

    };
  },
};


// reject logic if may suername
// delete old avatar url
