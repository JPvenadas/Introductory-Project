import {ProjectConfig} from "emberflow/lib/types";
import * as admin from "firebase-admin";
import {initializeEmberFlow} from "emberflow/lib";
import {dbStructure, Entity} from "../src/db-structure";

const projectConfig: ProjectConfig = {
  projectId: "pesbuk-ng-matatanda",
  budgetAlertTopicName: "max-budget-kill-switch",
  region: "asia-southeast1",
  rtdbName: "pesbuk-ng-matatanda-default-rtdb",
  maxCostLimitPerFunction: 1,
  specialCostLimitPerFunction: {},
};

admin.initializeApp({
  databaseURL: `https://${projectConfig.rtdbName}.${projectConfig.region}.firebasedatabase.app/`,
  storageBucket: `gs://${projectConfig.projectId}.appspot.com`,
});

export const initTestEmberflow = () =>
  initializeEmberFlow(
    projectConfig,
    admin,
    dbStructure,
    Entity,
    {},
    {},
    []
  );
