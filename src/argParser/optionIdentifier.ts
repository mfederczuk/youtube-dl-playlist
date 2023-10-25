/*
 * Node.js program to download a JSON playlist using youtube-dl.
 * Copyright (C) 2021  Michael Federczuk
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { inspect } from "util";
import { NonEmptyArray } from "./nonEmptyArray";
import { ValidationError, ValidationResult } from "./validation";

export class OptionIdentifier {
	constructor(codePoint: number);
	constructor(string: string);
	constructor(readonly codePointOrString: (number | string)) {
		if(typeof(codePointOrString) === "number") {
			if(codePointOrString === 0x2D) {
				throw new Error("Argument must not be 0x2D ('-')");
			}
		} else if(typeof(codePointOrString) === "string") {
			if(codePointOrString.length === 0) {
				throw new Error("Argument must not be empty");
			}

			if(codePointOrString.includes("=")) {
				throw new Error(`Argument (${inspect(codePointOrString)}) must not contain the equals character`);
			}
		} else {
			throw new TypeError("Argument must either be a number or a string");
		}
	}

	static validate(string: string): ValidationResult<OptionIdentifier> {
		if(string.startsWith("--")) {
			const longIdentifier = string.substring(2);

			if(longIdentifier.length === 0) {
				return [new ValidationError(2, 0, "Long identifier must not be empty")];
			}

			const errors: ValidationError[] = [];

			for(const match of longIdentifier.matchAll(/=/g)) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				errors.push(new ValidationError(match.index!, 1, "Long identifier must not be empty"));
			}

			if(errors.length > 0) {
				return errors as NonEmptyArray<ValidationError>;
			}

			return new OptionIdentifier(longIdentifier);
		}

		if(string.startsWith("-")) {
			const shortIdentifier = string.codePointAt(1);

			if(typeof(shortIdentifier) !== "number") {
				return [new ValidationError(1, 0, "Missing character after single '-'")];
			}

			const errors: ValidationError[] = [];

			if(shortIdentifier === 0x2D) {
				errors.push(new ValidationError(1, 1, "Short identifier must not be 0x2D ('-')"));
			}

			if(string.length > 2) {
				errors.push(new ValidationError(
					2,
					string.length - 2,
					"Unexpected characters after first character after single '-'"
				));
			}

			if(errors.length > 0) {
				return errors as NonEmptyArray<ValidationError>;
			}

			return new OptionIdentifier(shortIdentifier);
		}

		return [new ValidationError(
			0,
			string.length,
			"Invalid option identifier literal; Must start with either '--' or '-'"
		)];
	}
	static valid(string: string): boolean {
		return (OptionIdentifier.validate(string) instanceof OptionIdentifier);
	}
	static parse(string: string): OptionIdentifier {
		const result = this.validate(string);

		if(result instanceof OptionIdentifier) {
			return result;
		}

		throw result[0].toError(string);
	}

	isShort(): boolean {
		return (typeof(this.codePointOrString) === "number");
	}
	isLong(): boolean {
		return (typeof(this.codePointOrString) === "string");
	}

	get codePoint(): (number | undefined) {
		if(typeof(this.codePointOrString) === "number") {
			return this.codePointOrString;
		}

		return undefined;
	}
	get string(): (string | undefined) {
		if(typeof(this.codePointOrString) === "string") {
			return this.codePointOrString;
		}

		return undefined;
	}

	codePointAsString(): (string | undefined) {
		if(typeof(this.codePointOrString) === "number") {
			return String.fromCodePoint(this.codePointOrString);
		}

		return undefined;
	}

	visit<T = void, U = void>(
		onShort: (codePoint: number) => T,
		onLong: (string: string) => U
	): (T | U) {
		if(typeof(this.codePointOrString) === "number") {
			return onShort(this.codePointOrString);
		}

		if(typeof(this.codePointOrString) === "string") {
			return onLong(this.codePointOrString);
		}

		throw undefined;
	}

	visitCodePointAsString<T = void, U = void>(
		onShort: (character: string) => T,
		onLong: (string: string) => U
	): (T | U) {
		return this.visit(
			(codePoint) => onShort(String.fromCodePoint(codePoint)),
			onLong
		);
	}

	toString(): string {
		return this.visitCodePointAsString(
			(character) => `-${character}`,
			(string) => `--${string}`
		);
	}
}
