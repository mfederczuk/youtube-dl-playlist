/*
 * Copyright (c) 2023 Michael Federczuk
 * SPDX-License-Identifier: MPL-2.0 AND Apache-2.0
 */

import path from "path";
import { CLI, CLIParsingResult } from "./CLI";
import { SpecifiedOption } from "./utils/args/argsParsing";

const argv0: string = path.basename(process.argv[1]);

const cliParsingResult: CLIParsingResult = CLI.parseProcessArgs();

switch (cliParsingResult.type) {
	case "success": break;

	case "missingOperand(s)": {
		let msg: string = `${argv0}: `;

		if (typeof cliParsingResult.commandName === "string") {
			msg += `${cliParsingResult.commandName}: `;
		}

		if (cliParsingResult.specifiedOption instanceof SpecifiedOption) {
			msg += `${cliParsingResult.specifiedOption.getUsedIdentifier().toString({ withDashes: true })}: `;
		}

		msg += "missing argument";

		if (cliParsingResult.operandNames.length > 1) {
			msg += "s";
		}

		for (const operandName of cliParsingResult.operandNames) {
			msg += ` <${operandName}>`;
		}

		console.error(msg);
		process.exit(3);
	}

	// eslint-disable-next-line no-fallthrough
	case "excessiveOperand(s)": {
		let msg: string = `${argv0}: `;

		if (typeof cliParsingResult.commandName === "string") {
			msg += `${cliParsingResult.commandName}: `;
		}

		if (cliParsingResult.specifiedOption instanceof SpecifiedOption) {
			msg += `${cliParsingResult.specifiedOption.getUsedIdentifier().toString({ withDashes: true })}: `;
		}

		msg += `too many arguments: ${cliParsingResult.count}`;

		console.error(msg);
		process.exit(4);
	}

	// eslint-disable-next-line no-fallthrough
	case "invalidOption": {
		let msg: string = `${argv0}: `;

		if (typeof cliParsingResult.commandName === "string") {
			msg += `${cliParsingResult.commandName}: `;
		}

		msg += `${cliParsingResult.invalidOptionIdentifier.toString({ withDashes: true })}: invalid option`;

		console.error(msg);
		process.exit(5);
	}

	// eslint-disable-next-line no-fallthrough
	case "unknownCommand": {
		console.error(`${argv0}: ${cliParsingResult.commandName}: unknown command`);
		process.exit(8);
	}

	// eslint-disable-next-line no-fallthrough
	case "emptyOperand": {
		let msg: string = `${argv0}: `;

		if (typeof cliParsingResult.commandName === "string") {
			msg += `${cliParsingResult.commandName}: `;
		}

		if (cliParsingResult.specifiedOption instanceof SpecifiedOption) {
			msg += `${cliParsingResult.specifiedOption.getUsedIdentifier().toString({ withDashes: true })}: `;
		}

		msg += "argument ";

		if (typeof cliParsingResult.n === "number") {
			msg += `${cliParsingResult.n}: `;
		}

		msg += "must not empty";

		console.error(msg);
		process.exit(9);
	}
}

const cli: CLI = cliParsingResult.cli;

console.log(cli);
