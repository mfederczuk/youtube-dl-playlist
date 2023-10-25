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
import type { DataType } from "./DataType";
import type { OptionIdentifier } from "./OptionIdentifier";
import { OptionPriority } from "./OptionPriority";

export class OptionArgumentDefinition implements Inspectable {

	readonly #name: string;
	readonly #dataType: DataType;

	constructor(name: string, dataType: DataType) {
		if (name.length === 0) {
			throw new InvalidArgumentException("Option-argument name must not be empty");
		}

		if (/[<>]/.test(name)) {
			throw new InvalidArgumentException("Option-argument name must not contain less-than or greater-than characters ('<', '>')");
		}

		this.#name = name;
		this.#dataType = dataType;

		deepFreeze(this);
	}

	getName(): string {
		return this.#name;
	}

	getDataType(): DataType {
		return this.#dataType;
	}

	toString(): string {
		return `<${this.#name}>`;
	}

	[util.inspect.custom](_depth: number, options: InspectOptionsStylized, inspect: typeof util.inspect): string {
		let str: string = this.constructor.name;
		str += " " + options.stylize(`<${this.#name}>`, "special");
		str += " " + inspect({ dataType: this.#dataType }, options);
		return str;
	}
}
deepFreeze(OptionArgumentDefinition);

export class OptionDefinition implements Inspectable {

	readonly #identifiers: readonly OptionIdentifier[];
	readonly #argumentSpec?: {
		readonly definition: OptionArgumentDefinition;
		readonly required: boolean;
	};
	readonly #priority: OptionPriority;

	constructor(
		identifiers: readonly OptionIdentifier[],
		argumentDefinition: OptionArgumentDefinition,
		argumentRequired?: boolean,
		priority?: OptionPriority,
	);
	constructor(identifiers: readonly OptionIdentifier[], priority?: OptionPriority);
	constructor(
		identifiers: readonly OptionIdentifier[],
		argumentDefinitionOrPriority?: (OptionArgumentDefinition | OptionPriority),
		argumentRequired: boolean = true,
		priority: OptionPriority = OptionPriority.NORMAL,
	) {
		if (identifiers.length === 0) {
			throw new InvalidArgumentException("At least one identifier must be given");
		}

		compareEach(
			identifiers,
			(identifierA: OptionIdentifier, identifierB: OptionIdentifier, indexA: number, indexB: number) => {
				if (!(identifierA.equals(identifierB))) {
					return;
				}

				let msg: string = "Duplicate ";
				if (identifierA.isShortStyle()) {
					msg += "short";
				} else {
					msg += "long";
				}
				msg += `-style identifier ${quoteString(identifierA.toString())} at index ${indexA} and ${indexB}`;

				throw new InvalidArgumentException(msg);
			},
		);

		this.#identifiers = [...identifiers];

		if (argumentDefinitionOrPriority instanceof OptionArgumentDefinition) {
			this.#argumentSpec = {
				definition: argumentDefinitionOrPriority,
				required: argumentRequired,
			};
		} else {
			if (argumentDefinitionOrPriority !== undefined) {
				priority = argumentDefinitionOrPriority;
			}

			this.#argumentSpec = undefined;
		}

		this.#priority = priority;

		deepFreeze(this);
	}

	getIdentifiers(): OptionIdentifier[] {
		return [...(this.#identifiers)];
	}

	getArgumentDefinition(): (OptionArgumentDefinition | undefined) {
		return this.#argumentSpec?.definition;
	}
	isArgumentDefined(): boolean {
		return (typeof this.#argumentSpec === "object");
	}

	isArgumentRequired(): boolean {
		return (this.#argumentSpec?.required ?? false);
	}

	getPriority(): OptionPriority {
		return this.#priority;
	}
	isNormalPriority(): boolean {
		return (this.#priority === OptionPriority.NORMAL);
	}
	isHighPriority(): boolean {
		return (this.#priority === OptionPriority.HIGH);
	}

	toString(): string {
		let str: string = "";

		str += this.#identifiers[0].toString({ withDashes: true });

		for (const identifier of this.#identifiers.slice(1)) {
			str += ", " + identifier.toString({ withDashes: true });
		}

		if (typeof this.#argumentSpec === "object") {
			const lastIdentifier: OptionIdentifier = this.#identifiers[this.#identifiers.length - 1];

			let tmp: string = `<${this.#argumentSpec.definition.getName()}>`;

			if (lastIdentifier.isLongStyle()) {
				tmp = ("=" + tmp);
			}

			if (!(this.#argumentSpec.required)) {
				tmp = `[${tmp}]`;
			}

			str += tmp;
		}

		return str;
	}

	[util.inspect.custom](_depth: number, options: InspectOptionsStylized, inspect: typeof util.inspect): string {
		const obj = {
			identifiers: this.#identifiers,
			argumentDefinition: this.#argumentSpec?.definition,
			...((typeof this.#argumentSpec === "object") ? { argumentRequired: this.#argumentSpec.required } : {}),
			priority: this.#priority,
		} as const;

		return (this.constructor.name + " " + inspect(obj, options));
	}
}
deepFreeze(OptionDefinition);
