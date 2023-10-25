/*
 * Copyright (c) 2023 Michael Federczuk
 * SPDX-License-Identifier: MPL-2.0 AND Apache-2.0
 */

import { InvalidArgumentException } from "@mfederczuk/custom-exception";
import { deepFreeze } from "@mfederczuk/deeptools";
import type { InspectOptionsStylized } from "util";
import util from "util";
import type { Inspectable } from "../Inspectable";
import type { DataT } from "./DataType";
import type { DataValue } from "./DataValue";
import type { OperandDefinition } from "./OperandDefinition";

export class OperandInstance implements Inspectable {

	readonly #definition: OperandDefinition;
	readonly #value: DataValue<DataT>;

	constructor(definition: OperandDefinition, value: DataValue) {
		if (definition.getDataType() !== value.getType()) {
			throw new InvalidArgumentException("Operand definition's data type and argument value's data type must be the same instance");
		}

		this.#definition = definition;
		this.#value = value;

		deepFreeze(this);
	}

	getDefinition(): OperandDefinition {
		return this.#definition;
	}

	getValue(): DataValue {
		return this.#value;
	}

	toString(): string {
		return String(this.#value);
	}

	[util.inspect.custom](_depth: number, options: InspectOptionsStylized, inspect: typeof util.inspect) {
		let str: string = this.constructor.name;
		str += " " + options.stylize(String(this.#value), "special");
		str += " " + inspect({ definition: this.#definition }, options);
		return str;
	}
}

deepFreeze(OperandInstance);
