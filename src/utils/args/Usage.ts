/*
 * Copyright (c) 2023 Michael Federczuk
 * SPDX-License-Identifier: MPL-2.0 AND Apache-2.0
 */

import { InvalidArgumentException } from "@mfederczuk/custom-exception";
import { deepFreeze } from "@mfederczuk/deeptools";
import type { InspectOptionsStylized } from "util";
import util from "util";
import { compareEach } from "../arrays";
import type { Inspectable } from "../Inspectable";
import { quoteString } from "../strings";
import type { OperandDefinition } from "./OperandDefinition";
import type { OptionDefinition } from "./OptionDefinition";

export abstract class Usage implements Inspectable {

	abstract toString(): string;

	abstract [util.inspect.custom](
		depth: number,
		options: InspectOptionsStylized,
		inspect: typeof util.inspect,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	): any;
}


function checkOptionDefinitions(optionDefinitions: readonly OptionDefinition[]) {
	compareEach(
		optionDefinitions,
		(optionDefinitionA: OptionDefinition, optionDefinitionB: OptionDefinition, indexA: number, indexB: number) => {
			for (const optionIdentifierA of optionDefinitionA.getIdentifiers()) {
				for (const optionIdentifierB of optionDefinitionB.getIdentifiers()) {
					if (!(optionIdentifierA.equals(optionIdentifierB))) {
						continue;
					}

					let msg: string = "Duplicate ";
					if (optionIdentifierA.isShortStyle()) {
						msg += "short";
					} else {
						msg += "long";
					}
					msg += "-style identifier ";
					msg += quoteString(optionIdentifierA.toString());
					msg += ` of option definitions at index ${indexA} and ${indexB}`;

					throw new InvalidArgumentException(msg);
				}
			}
		}
	);
}

function optionDefinitionsToString(optionDefinitions: readonly OptionDefinition[]): string {
	let str: string = "";

	for (const optionDefinition of optionDefinitions) {
		if (str.length > 0) {
			str += " ";
		}

		str += `[${optionDefinition}]`;
	}

	return str;
}

export class RegularUsage extends Usage {

	readonly #optionDefinitions: readonly OptionDefinition[];
	readonly #operandDefinitions: readonly OperandDefinition[];

	constructor(optionDefinitions: readonly OptionDefinition[], operandDefinitions: readonly OperandDefinition[]) {
		super();

		checkOptionDefinitions(optionDefinitions);

		this.#optionDefinitions = [...optionDefinitions];
		this.#operandDefinitions = [...operandDefinitions];

		deepFreeze(this);
	}

	static empty(): RegularUsage {
		return new RegularUsage([], []);
	}

	getOptionDefinitions(): OptionDefinition[] {
		return [...(this.#optionDefinitions)];
	}

	getOperandDefinitions(): OperandDefinition[] {
		return [...(this.#operandDefinitions)];
	}

	override toString(): string {
		let str: string = "";

		str += optionDefinitionsToString(this.#optionDefinitions);

		for (const operandDefinition of this.#operandDefinitions) {
			if (str.length > 0) {
				str += " ";
			}

			str += operandDefinition.toString();
		}

		return str;
	}

	override [util.inspect.custom](
		_depth: number,
		options: InspectOptionsStylized,
		inspect: typeof util.inspect,
	): string {
		const obj = {
			optionDefinitions: this.#optionDefinitions,
			operandDefinitions: this.#operandDefinitions,
		} as const;

		return (this.constructor.name + " " + inspect(obj, options));
	}
}
deepFreeze(RegularUsage);

export class CommandsUsage extends Usage {

	readonly #preCommandOptionDefinitions: readonly OptionDefinition[];
	readonly #commandUsages: Map<string, Usage>;

	constructor(
		preCommandOptionDefinitions: readonly OptionDefinition[],
		commandUsages: (Iterable<readonly [name: string, usage: Usage]> | Record<string, Usage>),
	) {
		super();

		checkOptionDefinitions(preCommandOptionDefinitions);

		this.#preCommandOptionDefinitions = preCommandOptionDefinitions;

		if (Symbol.iterator in commandUsages) {
			this.#commandUsages = new Map(commandUsages);
		} else {
			this.#commandUsages = new Map();

			for (const name in commandUsages) {
				this.#commandUsages.set(name, commandUsages[name]);
			}
		}

		if (this.#commandUsages.size === 0) {
			throw new InvalidArgumentException("At least one command must be given");
		}

		for (const commandName of this.#commandUsages.keys()) {
			if (commandName.length === 0) {
				throw new InvalidArgumentException("Command name must not be empty");
			}
		}

		deepFreeze(this);
	}

	getPreCommandOptionDefinitions(): OptionDefinition[] {
		return [...(this.#preCommandOptionDefinitions)];
	}

	getCommandUsages(): Map<string, Usage> {
		return new Map(this.#commandUsages.entries());
	}

	override toString(): string {
		let str: string = "";

		for (const [commandName, commandUsage] of this.#commandUsages) {
			if (str.length > 0) {
				str += " | ";
			}

			str += commandName;

			const commandUsageStr: string = commandUsage.toString();
			if (commandUsageStr.length > 0) {
				str += (" " + commandUsageStr);
			}
		}

		if (this.#commandUsages.size > 1) {
			str = `(${str})`;
		}

		const optionDefinitionsStr: string = optionDefinitionsToString(this.#preCommandOptionDefinitions);

		if ((str.length > 0) && (optionDefinitionsStr.length > 0)) {
			str = (" " + str);
		}

		str = (optionDefinitionsStr + str);

		return str;
	}

	override [util.inspect.custom](
		_depth: number,
		options: InspectOptionsStylized,
		inspect: typeof util.inspect,
	): string {
		const obj = {
			preCommandOptionDefinitions: this.#preCommandOptionDefinitions,
			commandUsages: this.#commandUsages,
		} as const;

		return (this.constructor.name + " " + inspect(obj, options));
	}
}
deepFreeze(CommandsUsage);


export interface Usage {
	isRegular(): this is RegularUsage;
	isCommands(): this is CommandsUsage;
}

Usage.prototype.isRegular = function(this: Usage): boolean {
	return (this instanceof RegularUsage);
};

Usage.prototype.isCommands = function(this: Usage): boolean {
	return (this instanceof CommandsUsage);
};

deepFreeze(Usage);
