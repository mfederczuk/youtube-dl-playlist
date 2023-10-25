import { cliUsage } from "./CLI";
import { parseProcessArgs } from "./utils/args/argsParsing_new";

const result = parseProcessArgs(cliUsage);
console.log(result);
