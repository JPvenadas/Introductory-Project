import {postValidator} from "../src/validators";

describe("postValidator", () => {
  test("creating a post.. should return empty validation result " +
    "when all fields are provided", async () => {
    const form = {
      "@actionType": "create",
      "content": "Hello World",
    };

    const validationResult = await postValidator(form);
    expect(validationResult).toEqual({});
  });

  test("creating a post.. should return error content validation " +
    "result when content is undefined", async () => {
    const form = {
      "@actionType": "create",
    };

    const validationResult = await postValidator(form);
    expect(validationResult).toEqual({content: ["validation.required"]});
  });

  test("creating a post.. should return error content validation " +
    "result when content is empty string", async () => {
    const form = {
      "@actionType": "create",
      "content": "",
    };

    const validationResult = await postValidator(form);
    expect(validationResult).toEqual({content: ["validation.required"]});
  });

  test("creating a post.. should return error content validation " +
    "result when content is only spaces", async () => {
    const form = {
      "@actionType": "create",
      "content": "          ",
    };

    const validationResult = await postValidator(form);
    expect(validationResult).toEqual({content: ["validation.required"]});
  });

  test("creating a post.. should return empty validation result " +
    "when fileUrl is provided and content is undefined", async () => {
    const form = {
      "@actionType": "create",
      "fileUrl": "temp/sample-image.jpg",
    };

    const validationResult = await postValidator(form);
    expect(validationResult).toEqual({});
  });

  test("updating a post.. should return empty validation result " +
    "when updating other fields", async () => {
    const form = {
      "@actionType": "update",
      "privacy": "friends",
    };

    const validationResult = await postValidator(form);
    expect(validationResult).toEqual({});
  });

  test("updating a post.. should return empty validation result " +
    "when updating content field with a non empty string", async () => {
    const form = {
      "@actionType": "update",
      "content": "Hi World",
    };

    const validationResult = await postValidator(form);
    expect(validationResult).toEqual({});
  });

  test("updating a post.. should return error content validation result " +
    "when updating content field with empty string", async () => {
    const form = {
      "@actionType": "update",
      "content": "",
    };

    const validationResult = await postValidator(form);
    expect(validationResult).toEqual({content: ["validation.required"]});
  });

  test("updating a post.. should return error content validation result " +
    "when updating content field with only spaces", async () => {
    const form = {
      "@actionType": "update",
      "content": "          ",
    };

    const validationResult = await postValidator(form);
    expect(validationResult).toEqual({content: ["validation.required"]});
  });

  test("updating a post.. should return empty validation result " +
    "when updating fileUrl and undefined content", async () => {
    const form = {
      "@actionType": "update",
      "fileUrl": "temp/sample-image.jpg",
    };

    const validationResult = await postValidator(form);
    expect(validationResult).toEqual({});
  });

  test("deleting a post.. should return empty validation result", async () => {
    const form = {
      "@actionType": "delete",
    };

    const validationResult = await postValidator(form);
    expect(validationResult).toEqual({});
  });
});
