import * as admin from "firebase-admin";
import {dbStructure, Entity} from "./db-structure";
import {initializeEmberFlow} from "emberflow";
import {securityConfig} from "./security";
import {validatorConfig} from "./validators";
import {logics} from "./business-logics";
import {ProjectConfig} from "emberflow/lib/types";

admin.initializeApp();

const projectConfig: ProjectConfig = {
  projectId: "pesbuk-ng-matatanda",
  budgetAlertTopicName: "max-budget-kill-switch",
  region: "asia-southeast1",
  rtdbName: "pesbuk-ng-matatanda-default-rtdb",
  maxCostLimitPerFunction: 1,
  specialCostLimitPerFunction: {},
};

(async () => {
  const {functionsConfig} = await initializeEmberFlow(
    projectConfig,
    admin,
    dbStructure,
    Entity,
    securityConfig,
    validatorConfig,
    logics,
  );

  Object.entries(functionsConfig).forEach(([key, value]) => {
    exports[key] = value;
  });
})();
