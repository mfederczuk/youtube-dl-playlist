/*
 * Copyright (c) 2023 Michael Federczuk
 * SPDX-License-Identifier: MPL-2.0 AND Apache-2.0
 */

import { IllegalStateException, InvalidArgumentException } from "@mfederczuk/custom-exception";
import { deepFreeze } from "@mfederczuk/deeptools";
import type { InspectOptionsStylized } from "util";
import util from "util";
import type { Inspectable } from "../Inspectable";
import type { Char } from "../supportTypes";
import type { OperandDefinition } from "./OperandDefinition";
import { OptionDefinition } from "./OptionDefinition";
import { OptionIdentifier } from "./OptionIdentifier";
import { OptionStyle } from "./OptionStyle";
import type { CommandsUsage, Usage } from "./Usage";
import { RegularUsage } from "./Usage";

export class SpecifiedOption implements Inspectable {

	readonly #definition: OptionDefinition;
	readonly #usedIdentifier: OptionIdentifier;
	readonly #argument?: string;

	constructor(definition: OptionDefinition, usedIdentifier: OptionIdentifier, argument?: string) {
		this.#definition = definition;
		this.#usedIdentifier = usedIdentifier;
		this.#argument = argument;
	}

	getDefinition(): OptionDefinition {
		return this.#definition;
	}

	getUsedIdentifier(): OptionIdentifier {
		return this.#usedIdentifier;
	}

	getArgument(): (string | undefined) {
		return this.#argument;
	}

	toString(): string {
		let str: string = "";

		str += this.#usedIdentifier.toString({ withDashes: true });

		if (typeof this.#argument === "string") {
			if (this.#usedIdentifier.isLongStyle()) {
				str += "=";
			}

			str += this.#argument;
		}

		return str;
	}

	[util.inspect.custom](_depth: number, options: InspectOptionsStylized, inspect: typeof util.inspect): string {
		let str: string = this.constructor.name;
		str += " " + options.stylize(this.toString(), "special");
		str += " " + inspect({ definition: this.#definition }, options);
		return str;
	}
}
deepFreeze(SpecifiedOption);

export class SpecifiedOperand implements Inspectable {

	readonly #definition: OperandDefinition;
	readonly #value: string;

	constructor(definition: OperandDefinition, value: string) {
		this.#definition = definition;
		this.#value = value;

		deepFreeze(this);
	}

	getDefinition(): OperandDefinition {
		return this.#definition;
	}

	getValue(): string {
		return this.#value;
	}

	toString(): string {
		return this.#value;
	}

	[util.inspect.custom](_depth: number, options: util.InspectOptionsStylized, inspect: typeof util.inspect) {
		let str: string = this.constructor.name;
		str += " " + options.stylize(this.#value, "special");
		str += " " + inspect({ definition: this.#definition }, options);
		return str;
	}
}
deepFreeze(SpecifiedOperand);


export class RegularArgsParsingResult implements Inspectable {

	readonly #sourceUsage: RegularUsage;
	readonly #invalidOptionIdentifiers: readonly OptionIdentifier[];
	readonly #specifiedOptions: readonly SpecifiedOption[];
	readonly #operands: readonly SpecifiedOperand[];
	readonly #excessOperandCount: number;

	constructor(
		sourceUsage: RegularUsage,
		invalidOptionIdentifiers: readonly OptionIdentifier[],
		specifiedOptions: readonly SpecifiedOption[],
		operands: readonly SpecifiedOperand[],
		excessOperandCount: number,
	) {
		this.#sourceUsage = sourceUsage;
		this.#invalidOptionIdentifiers = [...invalidOptionIdentifiers];
		this.#specifiedOptions = [...specifiedOptions];
		this.#operands = [...operands];
		this.#excessOperandCount = excessOperandCount;

		deepFreeze(this);
	}

	getSourceUsage(): RegularUsage {
		return this.#sourceUsage;
	}

	getInvalidOptionIdentifiers(): OptionIdentifier[] {
		return [...(this.#invalidOptionIdentifiers)];
	}
	getFirstInvalidOptionIdentifier(): (OptionIdentifier | undefined) {
		return this.#invalidOptionIdentifiers[0];
	}

	getSpecifiedOptions(): SpecifiedOption[] {
		return [...(this.#specifiedOptions)];
	}

	getOperands(): SpecifiedOperand[] {
		return [...(this.#operands)];
	}

	getExcessOperandCount(): number {
		return this.#excessOperandCount;
	}

	getTotalOperandsCount(): number {
		return (this.#operands.length + this.#excessOperandCount);
	}

	[util.inspect.custom](_depth: number, options: InspectOptionsStylized, inspect: typeof util.inspect): string {
		const obj = {
			invalidOptionIdentifiers: this.#invalidOptionIdentifiers,
			specifiedOptions: this.#specifiedOptions,
			operands: this.#operands,
			excessOperandCount: this.#excessOperandCount,
		} as const;

		return (this.constructor.name + " " + inspect(obj, options));
	}
}
deepFreeze(RegularArgsParsingResult);

export class CommandsArgsParsingResult implements Inspectable {

	static readonly unknownCommandUsage: Usage = new RegularUsage([], []);

	readonly #sourceUsage: CommandsUsage;
	readonly #invalidPreCommandOptionIdentifiers: readonly OptionIdentifier[];
	readonly #specifiedPreCommandOptions: readonly SpecifiedOption[];
	readonly #specifiedCommand: ({
		readonly name: string;
		readonly args: ArgsParsingResult;
	} | undefined);

	constructor(
		sourceUsage: CommandsUsage,
		invalidPreCommandOptionIdentifiers: readonly OptionIdentifier[],
		specifiedPreCommandOptions: readonly SpecifiedOption[],
		specifiedCommand: ({
			readonly name: string;
			readonly args: ArgsParsingResult;
		} | undefined),
	) {
		this.#sourceUsage = sourceUsage;
		this.#invalidPreCommandOptionIdentifiers = [...invalidPreCommandOptionIdentifiers];
		this.#specifiedPreCommandOptions = [...specifiedPreCommandOptions];
		this.#specifiedCommand = specifiedCommand;

		deepFreeze(this);
	}

	getSourceUsage(): CommandsUsage {
		return this.#sourceUsage;
	}

	getInvalidPreCommandOptionIdentifiers(): OptionIdentifier[] {
		return [...this.#invalidPreCommandOptionIdentifiers];
	}
	getFirstInvalidPreCommandOptionIdentifier(): (OptionIdentifier | undefined) {
		return this.#invalidPreCommandOptionIdentifiers[0];
	}

	getSpecifiedPreCommandOptions(): SpecifiedOption[] {
		return [...this.#specifiedPreCommandOptions];
	}

	isCommandSpecified(): boolean {
		return ((typeof this.#specifiedCommand) === "object");
	}

	getCommandName(): string {
		if (typeof this.#specifiedCommand === "object") {
			return this.#specifiedCommand.name;
		}

		throw new IllegalStateException("No command specified");
	}

	getCommandArgsParsingResult(): (ArgsParsingResult | undefined) {
		if (typeof this.#specifiedCommand === "object") {
			if (this.#specifiedCommand.args.getSourceUsage() === CommandsArgsParsingResult.unknownCommandUsage) {
				return undefined;
			}

			return this.#specifiedCommand.args;
		}

		throw new IllegalStateException("No command specified");
	}

	getTotalOperandsCount(): number {
		if (typeof this.#specifiedCommand !== "object") {
			return 0;
		}

		return (1 + this.#specifiedCommand.args.getTotalOperandsCount());
	}

	[util.inspect.custom](_depth: number, options: InspectOptionsStylized, inspect: typeof util.inspect): string {
		const obj = {
			invalidPreCommandOptionIdentifiers: this.#invalidPreCommandOptionIdentifiers,
			specifiedPreCommandOptions: this.#specifiedPreCommandOptions,
			specifiedCommand: this.#specifiedCommand,
		} as const;

		return (this.constructor.name + " " + inspect(obj, options));
	}
}
deepFreeze(CommandsArgsParsingResult);

export type ArgsParsingResult = (RegularArgsParsingResult | CommandsArgsParsingResult);


export type ParseArgsOptions = {
	processOptions: boolean;
};

export function parseArgs(
	usage: RegularUsage,
	args: readonly string[],
	options?: Readonly<ParseArgsOptions>,
): RegularArgsParsingResult;

export function parseArgs(
	usage: CommandsUsage,
	args: readonly string[],
	options?: Readonly<ParseArgsOptions>,
): CommandsArgsParsingResult;

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
	const processingOptions: boolean = !!(options.processOptions);

	if (usage.isRegular()) {
		return parseArgsByRegularUsage(usage, args, processingOptions);
	}

	if (usage.isCommands()) {
		return parseArgsByCommandsUsage(usage, args, processingOptions);
	}

	throw new InvalidArgumentException(`Unsupported usage type ${usage.constructor.name}`);
}
deepFreeze(parseArgs);

function parseArgsByRegularUsage(
	usage: RegularUsage,
	args: readonly string[],
	processingOptions: boolean,
): RegularArgsParsingResult {
	const optionDefinitions: readonly OptionDefinition[] = usage.getOptionDefinitions();

	const invalidOptionIdentifiers: OptionIdentifier[] = [];
	const specifiedOptions: SpecifiedOption[] = [];
	const operandValues: string[] = [];

	for (let i: number = 0; i < args.length; ++i) {
		const arg: string = args[i];

		if (processingOptions && (arg.length >= 2) && arg.startsWith("-") && !(arg.startsWith("--="))) {
			if (arg === "--") {
				processingOptions = false;
				continue;
			}

			if (arg.startsWith("--")) {
				const equalsIndex: number = arg.indexOf("=");

				const optionIdentifierWord: string = arg.substring(2, ((equalsIndex >= 0) ? equalsIndex : arg.length));
				const optionIdentifier = new OptionIdentifier(OptionStyle.LONG, optionIdentifierWord);

				const foundOptionDefinition: (OptionDefinition | undefined) = optionDefinitions
					.find((optionDefinition: OptionDefinition) => {
						return optionDefinition.getIdentifiers()
							.some((usageOptionIdentifier: OptionIdentifier) => {
								return usageOptionIdentifier.equals(optionIdentifier);
							});
					});

				if (!(foundOptionDefinition instanceof OptionDefinition)) {
					invalidOptionIdentifiers.push(optionIdentifier);
					continue;
				}

				let optionArg: (string | undefined) = undefined;

				if (equalsIndex >= 0) {
					optionArg = arg.substring(equalsIndex + 1);
				}

				if ((typeof optionArg !== "string") &&
				    foundOptionDefinition.isArgumentRequired() &&
				    ((i + 1) < args.length)) {

					++i;
					optionArg = args[i];
				}

				specifiedOptions.push(new SpecifiedOption(foundOptionDefinition, optionIdentifier, optionArg));
				continue;
			}

			for (let j: number = 1; j < arg.length; ++j) {
				const optionIdentifierChar: Char = (arg[j] as Char);
				const optionIdentifier = new OptionIdentifier(OptionStyle.SHORT, optionIdentifierChar);

				const foundOptionDefinition: (OptionDefinition | undefined) = optionDefinitions
					.find((optionDefinition: OptionDefinition) => {
						return optionDefinition.getIdentifiers()
							.some((usageOptionIdentifier: OptionIdentifier) => {
								return usageOptionIdentifier.equals(optionIdentifier);
							});
					});

				if (!(foundOptionDefinition instanceof OptionDefinition)) {
					invalidOptionIdentifiers.push(optionIdentifier);
					continue;
				}

				let optionArg: (string | undefined) = undefined;

				if (foundOptionDefinition.isArgumentDefined()) {
					if ((j + 1) < arg.length) {
						optionArg = arg.substring(j + 1);
						j = Infinity;
					}

					if ((typeof optionArg !== "string") &&
					    foundOptionDefinition.isArgumentRequired() &&
					    ((i + 1) < args.length)) {

						++i;
						optionArg = args[i];
					}
				}

				specifiedOptions.push(new SpecifiedOption(foundOptionDefinition, optionIdentifier, optionArg));
			}

			continue;
		}

		operandValues.push(arg);
	}

	const operandDefinitions: OperandDefinition[] = usage.getOperandDefinitions();

	const operands: SpecifiedOperand[] = [];

	while ((operandValues.length > 0) && (operandDefinitions.length > 0)) {
		const operandDefinition: OperandDefinition = (operandDefinitions.shift() as OperandDefinition);
		const value: string = (operandValues.shift() as string);

		operands.push(new SpecifiedOperand(operandDefinition, value));
	}

	return new RegularArgsParsingResult(
		usage,
		invalidOptionIdentifiers,
		specifiedOptions,
		operands,
		operandValues.length,
	);
}

function parseArgsByCommandsUsage(
	usage: CommandsUsage,
	args: readonly string[],
	processingOptions: boolean,
): CommandsArgsParsingResult {
	const preCommandOptionDefinitions: readonly OptionDefinition[] = usage.getPreCommandOptionDefinitions();

	const invalidPreCommandOptionIdentifiers: OptionIdentifier[] = [];
	const specifiedPreCommandOptions: SpecifiedOption[] = [];

	let commandNameIndex: number = -1;

	for (let i: number = 0; i < args.length; ++i) {
		const arg: string = args[i];

		if (!processingOptions || (arg.length < 2) || !(arg.startsWith("-")) || arg.startsWith("--=")) {
			commandNameIndex = i;
			break;
		}

		if (arg === "--") {
			processingOptions = false;
			continue;
		}

		if (arg.startsWith("--")) {
			const equalsIndex: number = arg.indexOf("=");

			const optionIdentifierWord: string = arg.substring(2, ((equalsIndex >= 0) ? equalsIndex : arg.length));
			const optionIdentifier = new OptionIdentifier(OptionStyle.LONG, optionIdentifierWord);

			const foundOptionDefinition: (OptionDefinition | undefined) = preCommandOptionDefinitions
				.find((preCommandOptionDefinition: OptionDefinition) => {
					return preCommandOptionDefinition.getIdentifiers()
						.some((preCommandUsageOptionIdentifier: OptionIdentifier) => {
							return preCommandUsageOptionIdentifier.equals(optionIdentifier);
						});
				});

			if (!(foundOptionDefinition instanceof OptionDefinition)) {
				invalidPreCommandOptionIdentifiers.push(optionIdentifier);
				continue;
			}

			let optionArg: (string | undefined) = undefined;

			if (equalsIndex >= 0) {
				optionArg = arg.substring(equalsIndex + 1);
			}

			if ((typeof optionArg !== "string") &&
			    foundOptionDefinition.isArgumentRequired() &&
			    ((i + 1) < args.length)) {

				++i;
				optionArg = args[i];
			}

			const specifiedOption = new SpecifiedOption(foundOptionDefinition, optionIdentifier, optionArg);
			specifiedPreCommandOptions.push(specifiedOption);

			continue;
		}

		for (let j: number = 1; j < arg.length; ++j) {
			const optionIdentifierChar: Char = (arg[j] as Char);
			const optionIdentifier = new OptionIdentifier(OptionStyle.SHORT, optionIdentifierChar);

			const foundOptionDefinition: (OptionDefinition | undefined) = preCommandOptionDefinitions
				.find((preCommandOptionDefinition: OptionDefinition) => {
					return preCommandOptionDefinition.getIdentifiers()
						.some((preCommandUsageOptionIdentifier: OptionIdentifier) => {
							return preCommandUsageOptionIdentifier.equals(optionIdentifier);
						});
				});

			if (!(foundOptionDefinition instanceof OptionDefinition)) {
				invalidPreCommandOptionIdentifiers.push(optionIdentifier);
				continue;
			}

			let optionArg: (string | undefined) = undefined;

			if (foundOptionDefinition.isArgumentDefined()) {
				if ((j + 1) < arg.length) {
					optionArg = arg.substring(j + 1);
					j = Infinity;
				}

				if ((typeof optionArg !== "string") &&
				    foundOptionDefinition.isArgumentRequired() &&
				    ((i + 1) < args.length)) {

					++i;
					optionArg = args[i];
				}
			}

			specifiedPreCommandOptions.push(new SpecifiedOption(foundOptionDefinition, optionIdentifier, optionArg));
		}
	}

	let specifiedCommand: ({
		readonly name: string;
		readonly args: ArgsParsingResult;
	} | undefined) = undefined;

	if (commandNameIndex >= 0) {
		const specifiedCommandName: string = args[commandNameIndex];

		let commandUsage: (Usage | undefined) = usage.getCommandUsages().get(specifiedCommandName);
		if (typeof commandUsage !== "object") {
			commandUsage = CommandsArgsParsingResult.unknownCommandUsage;
		}

		specifiedCommand = {
			name: specifiedCommandName,
			args: parseArgs(
				commandUsage,
				args.slice(commandNameIndex + 1),
				{ processOptions: processingOptions },
			),
		};
	}

	return new CommandsArgsParsingResult(
		usage,
		invalidPreCommandOptionIdentifiers,
		specifiedPreCommandOptions,
		specifiedCommand,
	);
}
