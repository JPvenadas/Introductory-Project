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

// A security function prevents users from updating their username
export const userSecurityFn: SecurityFn = async (
  entity,
  docPath,
  doc,
  actionType,
  modifiedFields,
) => {
  const rejected: SecurityResult = {
    status: "rejected",
  };
  const allowed: SecurityResult = {
    status: "allowed",
  };

  if (actionType === "update") {
    const fields: string[] = Object.keys(modifiedFields);
    if (fields.includes("username")) {
      rejected["message"] = "Cannot update username";
      return rejected;
    }
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
