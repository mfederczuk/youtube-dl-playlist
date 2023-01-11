/*
 * Copyright (c) 2023 Michael Federczuk
 * SPDX-License-Identifier: MPL-2.0 AND Apache-2.0
 */

import { IllegalStateException, InvalidArgumentException } from "@mfederczuk/custom-exception";
import { deepFreeze } from "@mfederczuk/deeptools";
import type { InspectOptionsStylized } from "util";
import { inspect } from "util";
import type { Inspectable } from "../Inspectable";
import type { Char } from "../supportTypes";
import { joinTaggedTemplateArgs } from "../taggedTemplates";
import { OptionStyle } from "./OptionStyle";

export class OptionIdentifier implements Inspectable {

	readonly #style: OptionStyle;
	readonly #charOrWord: (Char | string);

	constructor(style: OptionStyle.SHORT, char: Char);
	constructor(style: OptionStyle.LONG,  word: string);
	constructor(style: OptionStyle, charOrWord: (Char | string)) {
		if (style === OptionStyle.SHORT) {
			if (charOrWord.length !== 1) {
				throw new InvalidArgumentException("Short-style option identifier must be exactly one character");
			}
		} else {
			if (charOrWord.length === 0) {
				throw new InvalidArgumentException("Long-style option identifier must not be empty");
			}

			if (charOrWord.includes("=")) {
				throw new InvalidArgumentException("Long-style option identifier must not contain an equals character ('=')");
			}
		}

		this.#style = style;
		this.#charOrWord = charOrWord;

		deepFreeze(this);
	}

	getStyle(): OptionStyle {
		return this.#style;
	}

	isShortStyle(): boolean {
		return (this.#style === OptionStyle.SHORT);
	}

	isLongStyle(): boolean {
		return (this.#style === OptionStyle.LONG);
	}

	getChar(): Char {
		if (this.isShortStyle()) {
			return (this.#charOrWord as Char);
		}

		throw new IllegalStateException("Option identifier style is long");
	}

	getWord(): string {
		if (this.isLongStyle()) {
			return this.#charOrWord;
		}

		throw new IllegalStateException("Option identifier style is short");
	}

	equals(other: unknown): boolean {
		return ((this === other) ||
		        ((other instanceof OptionIdentifier) &&
		         (this.#style === other.#style) &&
		         (this.#charOrWord === other.#charOrWord)));
	}

	toString(options?: { readonly withDashes: boolean; }): string {
		let prefix: string = "";

		if (options?.withDashes) {
			prefix = ((this.#style === OptionStyle.SHORT) ? "-" : "--");
		}

		return (prefix + this.#charOrWord);
	}

	[inspect.custom](_depth: number, options: InspectOptionsStylized): string {
		return (this.constructor.name + " " + options.stylize(this.toString({ withDashes: true }), "special"));
	}
}
deepFreeze(OptionIdentifier);

export function optId(strings: TemplateStringsArray, ...args: unknown[]): OptionIdentifier {
	let str: string = joinTaggedTemplateArgs(strings, ...args);
	str = str.trimStart();

	if (!(str.startsWith("-"))) {
		throw new InvalidArgumentException("String must start with a dash character ('-')");
	}

	if (str.startsWith("--")) {
		const identifierWord: string = str.substring(2);

		return new OptionIdentifier(OptionStyle.LONG, identifierWord);
	}

	if (str.length !== 2) {
		throw new InvalidArgumentException("String starting with just one dash must be exactly 2 characters");
	}

	const identifierChar: Char = (str[1] as Char);

	return new OptionIdentifier(OptionStyle.SHORT, identifierChar);
}
deepFreeze(optId);

export function optIds(strings: TemplateStringsArray, ...args: unknown[]): OptionIdentifier[] {
	let str: string = joinTaggedTemplateArgs(strings, ...args);

	const identifiers: OptionIdentifier[] = [];

	do {
		str = str.trimStart();

		if (!(str.startsWith("-"))) {
			throw new InvalidArgumentException("Identifier must be preceded with a dash character ('-')");
		}

		const identifierEndIndex: number = str.search(/(,|$)/);

		if (!(str.startsWith("--"))) {
			if (identifierEndIndex !== 2) {
				throw new InvalidArgumentException("Identifier preceded with just one dash must be exactly 1 character");
			}

			const identifierChar: Char = (str[1] as Char);

			identifiers.push(new OptionIdentifier(OptionStyle.SHORT, identifierChar));
		} else {
			const identifierWord: string = str.substring(2, identifierEndIndex);

			identifiers.push(new OptionIdentifier(OptionStyle.LONG, identifierWord));
		}

		str = str.substring(identifierEndIndex + 1);
	} while (str.length > 0);

	return identifiers;
}
deepFreeze(optIds);
