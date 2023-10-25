/*
 * Copyright (c) 2023 Michael Federczuk
 * SPDX-License-Identifier: MPL-2.0 AND Apache-2.0
 */

import { InvalidArgumentException } from "@mfederczuk/custom-exception";
import { deepFreeze } from "@mfederczuk/deeptools";
import { filterInstance } from "../arrays";
import type { Char } from "../supportTypes";
import type { ArgsParsingCommandsResult, ArgsParsingRegularResult, ArgsParsingResult } from "./ArgsParsingResult";
import type { DataT, DataType, DataTypeParseResult } from "./DataType";
import type { OperandDefinition } from "./OperandDefinition";
import type { OperandInstance } from "./OperandInstance";
import { OptionArgumentDefinition, OptionDefinition } from "./OptionDefinition";
import type { OptionIdentifier } from "./OptionIdentifier";
import { OptionInstance } from "./OptionInstance";
import type { OptionStyle } from "./OptionStyle";
import type { CommandsUsage, RegularUsage, Usage } from "./Usage";

//#region public

export * from "./ArgsParsingResult";

export type ParseArgsOptions = {
	processOptions: boolean;
};

export function parseArgs(
	usage: RegularUsage,
	args: readonly string[],
	options?: Readonly<ParseArgsOptions>,
): ArgsParsingRegularResult;

export function parseArgs(
	usage: CommandsUsage,
	args: readonly string[],
	options?: Readonly<ParseArgsOptions>,
): ArgsParsingCommandsResult;

export function parseArgs(
	usage: Usage,
	args: readonly string[],
	options?: Readonly<ParseArgsOptions>,
): ArgsParsingResult;

export function parseArgs(
	usage: Usage,
	args: readonly string[],
	options: Readonly<ParseArgsOptions> = { processOptions: true },
): ArgsParsingResult {
	return parseArgsInternal([], usage, args, options.processOptions);
}

deepFreeze(parseArgs);


export function parseProcessArgs(usage: RegularUsage):  ArgsParsingRegularResult;
export function parseProcessArgs(usage: CommandsUsage): ArgsParsingCommandsResult;
export function parseProcessArgs(usage: Usage): ArgsParsingResult;
export function parseProcessArgs(usage: Usage): ArgsParsingResult {
	return parseArgs(usage, process.argv.slice(2));
}
deepFreeze(parseProcessArgs);

//#endregion

function parseArgsInternal(
	commandNamePath: readonly string[],
	usage: Usage,
	args: readonly string[],
	processingOptions: boolean,
): ArgsParsingResult {
	if (usage.isRegular()) {
		return parseArgsByRegularUsage(commandNamePath, usage, args, processingOptions);
	}

	if (usage.isCommands()) {
		return parseArgsByCommandsUsage(commandNamePath, usage, args, processingOptions);
	}

	throw new InvalidArgumentException(`Unsupported usage ${usage.constructor.name}`);
}

function argIsOption(arg: string): boolean {
	return ((arg.length >= 2) && arg.startsWith("-") && !(arg.startsWith("--=")));
}

function checkData<T extends (DataT | void)>(
	commandNamePath: readonly string[],
	usage: Usage,
	argumentDataType: DataType<Exclude<T, void>>,
	argumentValue: string,
	optionDefinitionOrOperandNr?: (OptionDefinition<T> | number),
): ({ readonly type: "success", readonly value: Exclude<T, void> } |
    ArgsParsingResult.Failure.InvalidEnumValue |
    ArgsParsingResult.Failure.EmptyArgument) {

	let optionDefinition: (OptionDefinition<T> | undefined);
	let operandNr: (number | undefined);

	if (optionDefinitionOrOperandNr instanceof OptionDefinition) {
		optionDefinition = optionDefinitionOrOperandNr;
	}

	if (typeof optionDefinitionOrOperandNr === "number") {
		operandNr = optionDefinitionOrOperandNr;
	}


	const result: DataTypeParseResult<Exclude<T, void>> = argumentDataType.parseString(argumentValue);

	switch (result.type) {
		case "failure/empty": {
			return {
				commandNamePath,
				type: "failure/emptyArgument",
				sourceUsage: usage,
				optionDefinition,
				operandNr,
			};
		}

		case "failure/invalidEnumValue": {
			return {
				commandNamePath,
				type: "failure/invalidEnumValue",
				sourceUsage: usage,
				optionDefinition,
				enumValues: result.enumValues,
				actualValue: argumentValue,
			};
		}

		case "success": {
			return result;
		}
	}
}

function createOptionInstance<T extends (DataT | void)>(
	commandNamePath: readonly string[],
	usage: Usage,
	definition: OptionDefinition<T>,
	usedIdentifier: OptionIdentifier,
	argumentValue: (string | undefined),
): (OptionInstance<T> |
    ArgsParsingResult.Failure.MissingArguments   |
    ArgsParsingResult.Failure.ExcessiveArguments |
    ArgsParsingResult.Failure.InvalidEnumValue   |
    ArgsParsingResult.Failure.EmptyArgument) {

	const argumentDefinition: (OptionArgumentDefinition<Exclude<T, void>> | undefined) =
		definition.getArgumentDefinition();

	if (!(argumentDefinition instanceof OptionArgumentDefinition)) {
		if (typeof argumentValue !== "string") {
			return new OptionInstance<T>(definition as OptionDefinition<Exclude<T, void>>, usedIdentifier, (() => {})());
		}

		return {
			commandNamePath,
			type: "failure/excessiveArgument(s)",
			sourceUsage: usage,
			optionDefinition: definition,
			count: 1,
		};
	}

	const argumentDataType: DataType<NonUndefined<T>> = argumentDefinition.getDataType();

	if (typeof argumentValue !== "string") {
		return {
			commandNamePath,
			type: "failure/missingArgument(s)",
			sourceUsage: usage,
			optionDefinition: definition,
			missingArgumentDefinitions: [argumentDefinition],
		};
	}


	const result = checkData<T>(commandNamePath, usage, argumentDataType, argumentValue, definition);

	if (result.type !== "success") {
		return result;
	}

	return new OptionInstance(definition, usedIdentifier, result.value);
}

function parseArgsByRegularUsage(
	commandNamePath: readonly string[],
	usage: RegularUsage,
	args: readonly string[],
	processingOptions: boolean,
): ArgsParsingRegularResult {
	const optionDefinitions: readonly OptionDefinition<unknown>[] = usage.getOptionDefinitions();

	const findOptionDefinitionByIdentifier =
		(optionIdentifier: OptionIdentifier): (OptionDefinition<unknown> | undefined) => {
			return optionDefinitions
				.find((optionDefinition: OptionDefinition<unknown>) => {
					return optionDefinition.getIdentifiers()
						.some((usageOptionIdentifier: OptionIdentifier) => {
							return usageOptionIdentifier.equals(optionIdentifier);
						});
				});
		};


	const specifiedOptions: {
		readonly definition: (OptionDefinition<unknown> | undefined),
		readonly usedIdentifier: OptionIdentifier,
		readonly argumentValue: (string | undefined),
	}[] = [];

	const specifiedOperandValues: string[] = [];

	for (let i: number = 0; i < args.length; ++i) {
		const arg: string = args[i];

		if (processingOptions && argIsOption(arg)) {
			if (arg === "--") {
				processingOptions = false;
				continue;
			}

			if (arg.startsWith("--")) {
				// long-style option

				const equalsIndex: number = arg.indexOf("=");
				const optionIdentifierEndIndex: number = ((equalsIndex >= 0) ? equalsIndex : arg.length);

				const optionIdentifierWord: string = arg.substring(2, optionIdentifierEndIndex);
				const optionIdentifier = new OptionIdentifier(OptionStyle.LONG, optionIdentifierWord);

				const foundOptionDefinition: (OptionDefinition<unknown> | undefined) =
					findOptionDefinitionByIdentifier(optionIdentifier);

				let optionArgumentValue: (string | undefined) = undefined;

				if (equalsIndex >= 0) {
					optionArgumentValue = arg.substring(equalsIndex + 1);
				}

				if ((typeof optionArgumentValue !== "string") &&
				    (foundOptionDefinition instanceof OptionDefinition) && foundOptionDefinition.isArgumentRequired() &&
				    ((i + 1) < args.length)) {

					++i;
					optionArgumentValue = args[i];
				}

				specifiedOptions.push({
					definition: foundOptionDefinition,
					usedIdentifier: optionIdentifier,
					argumentValue: optionArgumentValue,
				});
				continue;
			}

			// short-style option

			for (let j: number = 1; j < arg.length; ++j) {
				const optionIdentifierChar: Char = (arg[j] as Char);
				const optionIdentifier = new OptionIdentifier(OptionStyle.SHORT, optionIdentifierChar);

				const foundOptionDefinition: (OptionDefinition<unknown> | undefined) =
					findOptionDefinitionByIdentifier(optionIdentifier);

				let optionArgumentValue: (string | undefined) = undefined;

				if ((foundOptionDefinition instanceof OptionDefinition) && foundOptionDefinition.isArgumentDefined()) {
					if ((j + 1) < arg.length) {
						optionArgumentValue = arg.substring(j + 1);
						j = Infinity;
					}

					if ((typeof optionArgumentValue !== "string") &&
					    foundOptionDefinition.isArgumentRequired() &&
					    ((i + 1) < args.length)) {

						++i;
						optionArgumentValue = args[i];
					}
				}

				specifiedOptions.push({
					definition: foundOptionDefinition,
					usedIdentifier: optionIdentifier,
					argumentValue: optionArgumentValue,
				});
			}

			continue;
		}

		specifiedOperandValues.push(arg);
	}


	const invalidOptionIdentifiers: OptionIdentifier[] = [];
	const optionInstancesOrResults: (OptionInstance<unknown> | ArgsParsingResult.Failure)[] = [];

	for (const { definition, usedIdentifier, argumentValue } of specifiedOptions) {
		if (!(definition instanceof OptionDefinition)) {
			invalidOptionIdentifiers.push(usedIdentifier);
			continue;
		}

		const optionInstanceOrResult: (OptionInstance<unknown> | ArgsParsingResult.Failure) =
			createOptionInstance(
				commandNamePath,
				usage,
				definition,
				usedIdentifier,
				argumentValue,
			);

		optionInstancesOrResults.push(optionInstanceOrResult);
	}


	for (const optionInstanceOrResult of optionInstancesOrResults) {
		if ((optionInstanceOrResult instanceof OptionInstance) &&
		    optionInstanceOrResult.getDefinition().isHighPriority()) {

			return {
				commandNamePath,
				type: "success/regular/highPriorityOption",
				sourceUsage: usage,
				highPriorityOption: optionInstanceOrResult,
			};
		}
	}


	const operandDefinitions: readonly OperandDefinition<NotUndefined>[] = usage.getOperandDefinitions();

	if (specifiedOperandValues.length < operandDefinitions.length) {
		return {
			commandNamePath,
			type: "failure/missingArgument(s)",
			sourceUsage: usage,
			missingArgumentDefinitions: (operandDefinitions.slice(specifiedOperandValues.length) as [OperandDefinition<NotUndefined>, ...OperandDefinition<NotUndefined>[]]),
		};
	}

	if (specifiedOperandValues.length > operandDefinitions.length) {
		return {
			commandNamePath,
			type: "failure/excessiveArgument(s)",
			sourceUsage: usage,
			count: (specifiedOperandValues.length - operandDefinitions.length),
		};
	}

	const operandInstances: OperandInstance<NotUndefined>[] = [];

	for (let i: number = 0; i < specifiedOperandValues.length; ++i) {
		const operandDefinition: OperandDefinition<NotUndefined> = operandDefinitions[i];
		const operandDataType: DataType<NotUndefined> = operandDefinition.getDataType();
		const operandValue: string = specifiedOperandValues[i];

		const result =
			checkData(
				commandNamePath,
				usage,
				operandDataType,
				operandValue,
				((specifiedOperandValues.length > 1) ? (i + 1) : undefined),
			);

		if (result.type !== "success") {
			return result;
		}

		operandInstances.push(new OperandInstance(operandDefinition, result.value));
	}


	for (const optionInstanceOrResult of optionInstancesOrResults) {
		if (!(optionInstanceOrResult instanceof OptionInstance)) {
			return optionInstanceOrResult;
		}
	}


	return {
		commandNamePath,
		type: "success/regular/normal",
		sourceUsage: usage,
		options: new Set(filterInstance(optionInstancesOrResults, OptionInstance)),
		operands: operandInstances,
	};
}

function parseArgsByCommandsUsage(
	commandNamePath: readonly string[],
	usage: CommandsUsage,
	args: readonly string[],
	processingOptions: boolean,
): ArgsParsingCommandsResult {
	throw undefined;
}
