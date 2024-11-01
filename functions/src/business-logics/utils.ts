import { UserView } from "../types";
import { firestore } from "firebase-admin";
import DocumentData = firestore.DocumentData;
import { admin } from "emberflow/lib";

export const createUserView = (user: DocumentData): UserView => {
  const { ["@id"]: uid, avatarUrl, lastName, firstName } = user;
  const userView: UserView = {
    "@id": uid,
    firstName: firstName,
    lastName: lastName,
  };
  if (avatarUrl) {
    userView["avatarUrl"] = avatarUrl;
  }

  return userView;
};

export const deleteStorageFile = async (url: string) => {
  const bucket = admin.storage().bucket();
  const fileRef = bucket.file(url);
  await fileRef.delete();
};

export const moveStorageFile = async (srcPath: string, dstPath: string) => {
  const bucket = admin.storage().bucket();
  const fileRef = bucket.file(srcPath);
  await fileRef.move(dstPath);
};

export const getFileDataFromUrl = (
  url: string
): {
  filename: string;
  fileExtension: string;
} => {
  const urlArray = url.split("/");
  const filename = urlArray[urlArray.length - 1];
  const filenameArray = filename.split(".");
  const fileExtension = filenameArray[filenameArray.length - 1];

  return { filename, fileExtension };
};

export const getFileMetadata = async (
  url: string
): Promise<{
  mimeType: string;
  size: number;
  updated: string;
}> => {
  const bucket = admin.storage().bucket();
  const fileRef = bucket.file(url);
  const metaData = await fileRef.getMetadata();
  const { contentType, size, updated } = metaData[0];

  return {
    mimeType: contentType,
    size: size,
    updated: updated,
  };
};

export const getFileType = (mimeType: string): "image" | "video" | "misc" => {
  if (mimeType.startsWith("image")) {
    return "image";
  } else if (mimeType.startsWith("video")) {
    return "video";
  } else {
    return "misc";
  }
};
