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
import { ReadonlyNonEmptyArray } from "./nonEmptyArray";

export class ValidationError {
	constructor(
		readonly index: number,
		readonly length: number,
		readonly message: string
	) {
		if(typeof(index) !== "number") {
			throw new TypeError("'lineNo' argument must be of type number");
		}

		if(typeof(length) !== "number") {
			throw new TypeError("'length' argument must be of type number");
		}

		if(typeof(message) === "string") {
			if(message.length === 0) {
				throw new Error("'message' argument must not be empty");
			}
		} else {
			throw new TypeError("'message' argument must be of type string");
		}
	}

	toError(source?: string): Error {
		if(typeof(source) === "string" && this.length > 0) {
			const substring = source.substring(this.index, this.index + this.length);
			return new Error(`${this.index + 1}: (${inspect(substring)}) ${this.message}`);
		}

		return new Error(`${this.index + 1}: ${this.message}`);
	}
}

export type ValidationResult<T> = (T | ReadonlyNonEmptyArray<ValidationError>);
