/*
 * Copyright (c) 2023 Michael Federczuk
 * SPDX-License-Identifier: MPL-2.0 AND Apache-2.0
 */

import { InvalidArgumentException } from "@mfederczuk/custom-exception";
import { deepFreeze } from "@mfederczuk/deeptools";
import type { InspectOptionsStylized } from "util";
import util from "util";
import type { Inspectable } from "../Inspectable";
import type { DataType } from "./DataType";
import { StringDataType } from "./DataType";

export class OperandDefinition implements Inspectable {

	readonly #name: string;
	readonly #dataType: DataType;

	constructor(name: string, dataType: DataType = StringDataType.rejectEmpty) {
		if (name.length === 0) {
			throw new InvalidArgumentException("Operand name must not be empty");
		}

		if (/[<>]/.test(name)) {
			throw new InvalidArgumentException("Operand name must not contain less-than or greater-than characters ('<', '>')");
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

deepFreeze(OperandDefinition);
