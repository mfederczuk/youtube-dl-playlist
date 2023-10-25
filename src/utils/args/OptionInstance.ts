/*
 * Copyright (c) 2023 Michael Federczuk
 * SPDX-License-Identifier: MPL-2.0 AND Apache-2.0
 */

import { InvalidArgumentException } from "@mfederczuk/custom-exception";
import { deepFreeze } from "@mfederczuk/deeptools";
import type { InspectOptionsStylized } from "util";
import util from "util";
import type { Inspectable } from "../Inspectable";
import { DataValue } from "./DataValue";
import type { OptionDefinition } from "./OptionDefinition";
import { OptionArgumentDefinition } from "./OptionDefinition";
import type { OptionIdentifier } from "./OptionIdentifier";

export class OptionInstance implements Inspectable {

	readonly #definition: OptionDefinition;
	readonly #usedIdentifier: OptionIdentifier;
	readonly #argumentValue?: DataValue;

	constructor(definition: OptionDefinition, usedIdentifier: OptionIdentifier, argumentValue?: DataValue) {
		const argumentDefinition: (OptionArgumentDefinition | undefined) = definition.getArgumentDefinition();
		if (argumentDefinition instanceof OptionArgumentDefinition) {
			if (!(argumentValue instanceof DataValue)) {
				throw new InvalidArgumentException("Missing argument value");
			}

			if (argumentDefinition.getDataType() !== argumentValue.getType()) {
				throw new InvalidArgumentException("Argument definition's data type and argument value's data type must be the same instance");
			}
		} else {
			if (argumentValue instanceof DataValue) {
				throw new InvalidArgumentException("Excess argument value");
			}
		}

		this.#definition = definition;
		this.#usedIdentifier = usedIdentifier;
		this.#argumentValue = argumentValue;

		deepFreeze(this);
	}

	getDefinition(): OptionDefinition {
		return this.#definition;
	}

	getUsedIdentifier(): OptionIdentifier {
		return this.#usedIdentifier;
	}

	getArgumentValue(): (DataValue | undefined) {
		return this.#argumentValue;
	}

	toString(): string {
		let str: string = "";

		str += this.#usedIdentifier.toString({ withDashes: true });

		if (this.#argumentValue instanceof DataValue) {
			if (this.#usedIdentifier.isLongStyle()) {
				str += "=";
			}

			str += this.#argumentValue.toString();
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

deepFreeze(OptionInstance);
