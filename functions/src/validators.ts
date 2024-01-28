import {Entity} from "./db-structure";
import {firestore} from "firebase-admin";
import DocumentData = firestore.DocumentData;
import {ValidationResult, ValidatorConfig} from "emberflow/lib/types";

/**
 * A blank validator that always returns an empty ValidationResult object.
 *
 * @param {DocumentData} form - The document data to validate.
 * @return {Promise<ValidationResult>} An empty ValidationResult object.
 */
async function blankValidator(form: DocumentData)
    : Promise<ValidationResult> {
  console.log(form);
  return Promise.resolve({});
}

async function postValidator(form: DocumentData)
  : Promise<ValidationResult> {
  const {content, fileUrl, ["@actionType"]: actionType} = form;
  const validationResult: ValidationResult = {};

  if (actionType === "create") {
    if (!fileUrl) {
      if (!content || content.trim() === "") {
        validationResult["content"] = ["validation.required"];
      }
    }
  }

  if (actionType === "update") {
    if (!fileUrl) {
      if (content !== undefined && content.trim() === "") {
        validationResult["content"] = ["validation.required"];
      }
    }
  }

  return validationResult;
}

/**
 * The validator configuration object, mapping entity names to their respective
 * validator functions.
 *
 * @type {ValidatorConfig}
 */
const validatorConfig: ValidatorConfig = {
  [Entity.User]: blankValidator,
  [Entity.Post]: postValidator,
};

export {validatorConfig, postValidator};
