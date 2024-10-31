// TODO write onUserUpdateLogic
//  allow users to update their firstName, lastName, birthDate, and avatarUrl
//  avatarUrl must be saved to users/{uid}/profile-pictures path in storage
//  create a security fn that will prevent users from changing their username

import {Entity} from "../db-structure";
import {LogicConfig, LogicResultDoc} from "emberflow/lib/types";
import {getFileDataFromUrl, moveStorageFile} from "./utils";

export const onUserUpdateLogic: LogicConfig = {
  name: "onUserUpdateLogic",
  actionTypes: ["update"],
  modifiedFields: ["firstName", "lastName", "birthDate", "avatarUrl"],
  entities: [Entity.User],
  logicFn: async (action) => {
    const {
      eventContext: {
        docPath,
        docId,
      },
      modifiedFields,
    } = action;

    const {avatarUrl} = modifiedFields;

    if (avatarUrl) {
      const {fileExtension} = getFileDataFromUrl(avatarUrl);
      const fileFullname = `${docId}.${fileExtension}`;
      const fileDstPath = `users/${docId}/profile-pictures/${fileFullname}`;
      modifiedFields.avatarUrl = fileDstPath;
      await moveStorageFile(avatarUrl, fileDstPath);
    }

    const userLogicResultDoc: LogicResultDoc = {
      "action": "merge",
      "dstPath": docPath,
      "doc": modifiedFields,
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
