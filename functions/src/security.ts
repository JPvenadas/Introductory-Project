import {Entity} from "./db-structure";
import {SecurityConfig, SecurityFn} from "emberflow/lib/types";

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

export const securityConfig: SecurityConfig = {
  // Implement your security functions for each entity here
  [Entity.User]: allAllowed,
  [Entity.Notification]: allAllowed,
  [Entity.Post]: allAllowed,
  [Entity.Comment]: allAllowed,
  [Entity.Like]: allAllowed,
};
