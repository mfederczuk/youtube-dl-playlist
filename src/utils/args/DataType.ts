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

export abstract class DataType implements Inspectable {

	abstract validate(value: string): unknown;

	abstract toString(): string;

	abstract [util.inspect.custom](
		depth: number,
		options: InspectOptionsStylized,
		inspect: typeof util.inspect,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	): any;
}


export class StringDataType extends DataType {

	readonly #acceptEmpty: boolean;

	constructor(options: { readonly acceptEmpty: boolean; }) {
		super();

		this.#acceptEmpty = options.acceptEmpty;

		deepFreeze(this);
	}

	static readonly acceptEmpty: StringDataType = new StringDataType({ acceptEmpty: true });
	static readonly rejectEmpty: StringDataType = new StringDataType({ acceptEmpty: false });

	isEmptyStringAccepted(): boolean {
		return this.#acceptEmpty;
	}

	validate(value: string): boolean {
		return (this.#acceptEmpty || (value.length > 0));
	}

	override toString(): string {
		return "string";
	}

	override [util.inspect.custom](
		_depth: number,
		options: InspectOptionsStylized,
		inspect: typeof util.inspect,
	): string {
		return (this.constructor.name + " " + inspect({ acceptEmpty: this.#acceptEmpty }, options));
	}
}
deepFreeze(StringDataType);

export class StringEnumDataType extends DataType {

	readonly #values: readonly [string, ...string[]];

	constructor(...values: [string, ...string[]]) {
		super();

		if (values.length === 0) {
			throw new InvalidArgumentException("Values array must not be empty");
		}

		const emptyValueIndex: number = values.findIndex((value: string) => (value.length === 0));
		if (emptyValueIndex >= 0) {
			throw new InvalidArgumentException(`Value at index ${emptyValueIndex} must not be empty`);
		}

		compareEach(values, (valueA: string, valueB: string, indexA: number, indexB: number) => {
			if (valueA !== valueB) {
				return;
			}

			throw new InvalidArgumentException(`Duplicate value ${quoteString(valueA)} at index ${indexA} and ${indexB}`);
		});

		this.#values = [...values];

		deepFreeze(this);
	}

	getValues(): [string, ...string[]] {
		return [...(this.#values)];
	}

	override validate(value: string): boolean {
		return this.#values.includes(value);
	}

	override toString(): string {
		let str: string = "enum { ";

		str += quoteString(this.#values[0]);

		for (const value of this.#values.slice(1)) {
			str += (", " + quoteString(value));
		}

		str += " }";

		return str;
	}

	override [util.inspect.custom](
		_depth: number,
		options: InspectOptionsStylized,
		inspect: typeof util.inspect,
	): string {
		return (this.constructor.name + " " + inspect({ values: this.#values }, options));
	}
}
deepFreeze(StringEnumDataType);


export interface DataType {
	isString(): this is StringDataType;
	isEnum(): this is StringEnumDataType;
}

DataType.prototype.isString = function(this: DataType): boolean {
	return (this instanceof StringDataType);
};

DataType.prototype.isEnum = function(this: DataType): boolean {
	return (this instanceof StringEnumDataType);
};

deepFreeze(DataType);
