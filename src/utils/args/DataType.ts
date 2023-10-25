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
import { DataValue } from "./DataValue";

export type DataT = (boolean | number | string | bigint | null | DataTRecord);
interface DataTRecord {
	[key: (string | number)]: DataT;
}

export type DataTypeParseResult<T extends DataT = DataT> = {
	readonly type: "success";
	readonly value: T;
} | {
	readonly type: "failure/empty";
} | {
	readonly type: "failure/invalidEnumValue";
	readonly enumValues: readonly [string, ...string[]],
};

export abstract class DataType<T extends DataT = DataT> implements Inspectable {

	abstract parseString(str: string): DataTypeParseResult<T>;

	abstract validate(value: unknown): value is T;

	createValue(value: T): DataValue<T> {
		return new DataValue(this, value);
	}

	abstract toString(): string;

	abstract [util.inspect.custom](
		depth: number,
		options: InspectOptionsStylized,
		inspect: typeof util.inspect,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	): any;
}
deepFreeze(DataType);


export class StringDataType extends DataType<string> {

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

	override parseString(str: string): DataTypeParseResult<string> {
		if (!(this.validate(str))) {
			return { type: "failure/empty" };
		}

		return {
			type: "success",
			value: str,
		};
	}

	override validate(value: unknown): value is string {
		return ((typeof value === "string") && (this.#acceptEmpty || (value.length > 0)));
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

export class StringEnumDataType<UnionT extends string = string> extends DataType<UnionT> {

	readonly #values: readonly [UnionT, ...UnionT[]];

	constructor(...values: [UnionT, ...UnionT[]]) {
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

	override parseString(str: string): DataTypeParseResult<UnionT> {
		if (str.length === 0) {
			return { type: "failure/empty" };
		}

		if (!(this.validate(str))) {
			return {
				type: "failure/invalidEnumValue",
				enumValues: this.#values,
			};
		}

		return {
			type: "success",
			value: str,
		};
	}

	override validate(value: unknown): value is UnionT {
		return (this.#values as readonly unknown[]).includes(value);
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
