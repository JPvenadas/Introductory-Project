import {LogicConfig}
  from "emberflow/lib/types";
import {onPostCreateLogic} from "./post-logics";

const logics: LogicConfig[] = [
  onPostCreateLogic,
  // more logics here
];

export {logics};
