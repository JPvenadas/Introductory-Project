import {initTestEmberflow} from "./init-test-emberflow";
import {Entity} from "../src/db-structure";
import {UserView} from "../src/types";
import {userSecurityFn} from "../src/security";

initTestEmberflow();

const userId = "userId";
const user: UserView = {
  "@id": userId,
  "avatarUrl": `users/${userId}/profile-picture.jpeg`,
  "firstName": "Sample",
  "lastName": "User",
};

describe("userSecurityFn", () => {
  const entity = Entity.User;
  const actionType = "update";
  const docPath = `/users/${userId}`;
  const modifiedFieldsWithoutUsername = {
    "firstName": "Sample",
    "lastName": "User",
  };
  const modifiedFieldsWithUsername = {
    "firstName": "Sample",
    "lastName": "User",
    "username": "sampleuser",
  };

  it("should allow any field updates aside from username", async () => {
    const result = await userSecurityFn(entity, docPath, user,
      actionType, modifiedFieldsWithoutUsername, user);

    expect(result).toEqual({status: "allowed"});
  });

  it("should reject update if username is included in modified fields",
    async () => {
      const result = await userSecurityFn(entity, docPath, user,
        actionType, modifiedFieldsWithUsername, user);

      expect(result).toEqual({
        status: "rejected",
        message: "Cannot update username",
      });
    });
});
