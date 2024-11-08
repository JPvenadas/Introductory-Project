import {Entity} from "./db-structure";
import {SecurityConfig, SecurityFn, SecurityResult} from "emberflow/lib/types";

// A security function that allows all actions
const allAllowed: SecurityFn = async (
  entity,
  doc,
  actionType,
  modifiedFields
) => {
  console.log(`Security check for entity ${entity}, action type ${actionType},
   and modified fields:`, modifiedFields);
  return {
    status: "allowed",
  };
};

const userSecurityFn: SecurityFn = async (
  actionType,
  modifiedFields,
) => {
  const allowed: SecurityResult = {
    status: "allowed",
  };
  const rejected: SecurityResult = {
    status: "rejected",
    // message: "You are not allowed to change your username",
  };

  if (actionType === "update") {
    const fields: string[] = Object.keys(modifiedFields);

    for (const field of fields) {
      if (field === "username") {
        rejected["message"] = "security.user.update.username.rejected";
        return rejected;
      }
    }
    return rejected;
  }
  return allowed;
};

export const securityConfig: SecurityConfig = {
  // Implement your security functions for each entity here
  [Entity.User]: userSecurityFn,
  [Entity.Notification]: allAllowed,
  [Entity.Post]: allAllowed,
  [Entity.Comment]: allAllowed,
  [Entity.Like]: allAllowed,
};
