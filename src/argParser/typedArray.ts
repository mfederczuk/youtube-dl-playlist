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

export type TypeofResult = ("bigint" | "boolean" | "function" | "number" | "object" | "string" | "symbol" | "undefined");

// eslint-disable-next-line @typescript-eslint/ban-types
function requireTypedArray<T extends Function = never>(array: unknown[], type: (TypeofResult | T), argumentName?: string): (void | never) {
	const tester = (type instanceof Function
		? (item: unknown) => (item instanceof type)
		: (item: unknown) => (typeof(item) === type));

	array.forEach((item) => {
		if(tester(item)) {
			return;
		}

		if(argumentName !== undefined) {
			argumentName = `'${argumentName}' argument`;
		} else {
			argumentName = "Argument";
		}

		if(type instanceof Function) {
			const article = (/^[aeiou]/i.test(type.name) ? "an" : "a");
			throw new TypeError(`${argumentName}: must be ${article} ${type.name}`);
		}

		if(type === "undefined") {
			throw new TypeError(`${argumentName} must be undefined`);
		}

		const article = (/^[aeiou]/i.test(type) ? "an" : "a");
		throw new TypeError(`${argumentName} must be ${article} ${type}`);
	});
}
