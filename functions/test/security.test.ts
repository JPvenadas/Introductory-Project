import {Entity} from "emberflow/lib/sample-custom/db-structure";
import {User} from "../src/types";

import {userSecurityFn} from "../src/security";


const user: User = {
  "@id": "userId",
  "firstName": "sample",
  "lastName": "User",
  "username": "sampleUser",
};

describe("userSecurityFn", () => {
  const entity = Entity.User;
  const actionType = "update";
  const docPath = `/users/${user["@id"]}`;

  const modifiedFieldsWithUsername: User = {
    firstName: "changed",
    lastName: "User",
    username: "changedUser",

  } as User;

  const modifiedFieldsWithOnlyUsername: User = {
    username: "changedUser",
  } as User;

  const modifiedFieldsWithoutUsername: User = {
    firstName: "changed",
    lastName: "User",
  } as User;

  it("should allow when no username is in modifiedFields", async ()=> {
    const result =
      await userSecurityFn(entity,
        docPath, user, actionType, modifiedFieldsWithoutUsername, user
      );
    expect(result.status).toBe("allowed");
  });

  it("should reject when username is in modifiedFields", async ()=> {
    const result =
      await userSecurityFn(entity,
        docPath, user, actionType, modifiedFieldsWithUsername, user
      );
    expect(result.status).toBe("rejected");
  });

  it("", async ()=> {
    const result =
      await userSecurityFn(entity,
        docPath, user, actionType, modifiedFieldsWithOnlyUsername, user
      );
    expect(result.status).toBe("rejected");
  });
});
