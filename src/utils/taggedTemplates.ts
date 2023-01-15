/*
 * Copyright (c) 2023 Michael Federczuk
 * SPDX-License-Identifier: MPL-2.0 AND Apache-2.0
 */

import { InvalidArgumentException } from "@mfederczuk/custom-exception";
import { deepFreeze } from "@mfederczuk/deeptools";

export function joinTaggedTemplateArgs(strings: TemplateStringsArray, ...args: unknown[]): string {
	if (strings.length === 0) {
		throw new InvalidArgumentException("Strings array must not be empty");
	}

	if ((strings.length - 1) !== args.length) {
		throw new InvalidArgumentException("Strings array must have exactly one item more than rest arguments");
	}

	let joinedStr: string = strings[0];

	for (let i: number = 1; i < strings.length; ++i) {
		joinedStr += `${args[i - 1]}${joinedStr[i]}`;
	}

	return joinedStr;
}

deepFreeze(joinTaggedTemplateArgs);
