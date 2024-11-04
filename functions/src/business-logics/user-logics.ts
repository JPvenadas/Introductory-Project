// TODO write onUserUpdateLogic
//  allow users to update their firstName, lastName, birthDate, and avatarUrl
//  avatarUrl must be saved to users/{uid}/profile-pictures path in storage
//  create a security fn that will prevent users from changing their username

import {Entity} from "../db-structure";
import {LogicConfig, LogicResultDoc} from "emberflow/lib/types";

export const onUserUpdateLogic: LogicConfig = {
  name: "onUserUpdateLogic",
  actionTypes: ["update"],
  entities: [Entity.User],
  modifiedFields: ["all"],
  logicFn: async (action) => {
    const logicResultDocs: LogicResultDoc[] = [];
    return {
      name: "onUserUpdateLogic",
      status: "finished",
      documents: logicResultDocs,

    };
  },
};
