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

import { NonEmptyArray, ReadonlyNonEmptyArray } from "./nonEmptyArray";
import { OptionIdentifier } from "./optionIdentifier";

export class Option {
	readonly identifiers: ReadonlyNonEmptyArray<OptionIdentifier>;
	readonly argument?: {
		readonly name: string;
		readonly optional: boolean;
	};

	constructor(identifiers: ReadonlyNonEmptyArray<OptionIdentifier>);
	constructor(
		identifiers: ReadonlyNonEmptyArray<OptionIdentifier>,
		argumentName: string,
		optional: boolean
	);
	constructor(
		identifiers: ReadonlyNonEmptyArray<OptionIdentifier>,
		argumentName?: string,
		optionalArgument?: boolean
	) {
		ReadonlyNonEmptyArray(identifiers, "identifiers");
		// identifiers.forEach((identifier) => {
		// 	if(identifier)
		// });

		if(argumentName !== undefined) {
			if(typeof(argumentName) !== "") {
				throw new TypeError("'argumentName' argument must be a string");
			}

			if(typeof(optionalArgument) !== "boolean") {
				throw new TypeError("'optionalArgument' argument must be a boolean");
			}

			this.argument = {
				name: argumentName,
				optional: optionalArgument
			};
		} else {
			this.argument = undefined;
		}
	}
}
