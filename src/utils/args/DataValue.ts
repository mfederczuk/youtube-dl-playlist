/*
 * Copyright (c) 2023 Michael Federczuk
 * SPDX-License-Identifier: MPL-2.0 AND Apache-2.0
 */

import { InvalidArgumentException } from "@mfederczuk/custom-exception";
import { deepFreeze } from "@mfederczuk/deeptools";
import type { InspectOptionsStylized } from "util";
import util from "util";
import type { Inspectable } from "../Inspectable";
import type { DataT, DataType } from "./DataType";

export class DataValue<T extends DataT = DataT> implements Inspectable {

	readonly #type: DataType<T>;
	readonly #value: T;

	constructor(type: DataType<T>, value: T) {
		if (!(type.validate(value))) {
			throw new InvalidArgumentException("Invalid value");
		}

		this.#type = type;
		this.#value = value;

		deepFreeze(this);
	}

	getType(): DataType<T> {
		return this.#type;
	}

	get(): T {
		return this.#value;
	}

	toString(): string {
		return String(this.#value);
	}

	[util.inspect.custom](_depth: number, options: InspectOptionsStylized, inspect: typeof util.inspect): string {
		let str: string = this.constructor.name;
		str += (" " + inspect(this.#value, options));
		str += (" " + inspect({ type: this.#type }, options));
		return str;
	}
}

deepFreeze(DataValue);
