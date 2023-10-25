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

export type NonEmptyArray<T> = [T, ...T[]];

export function NonEmptyArray<T>(array: T[]): NonEmptyArray<T>;
export function NonEmptyArray<T>(array: readonly T[]): Readonly<NonEmptyArray<T>>;
export function NonEmptyArray<T>(array: T[]): NonEmptyArray<T> {

}

export function requireNonEmptyArray<T>(array: readonly T[], argumentName?: string): (void | never) {
	if(argumentName !== undefined) {
		argumentName = `'${argumentName}' argument`;
	} else {
		argumentName = "Argument";
	}

	if(!(array instanceof Array)) {
		throw new TypeError(`${argumentName} must be an array`);
	}

	if(array.length === 0) {
		throw new Error(`${argumentName} must not be empty`);
	}
}
