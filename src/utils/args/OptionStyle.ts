// SPDX-License-Identifier: CC0-1.0

import { deepFreeze } from "@mfederczuk/deeptools";

export namespace OptionStyle {
	/**
	 * POSIX-style (e.g.: `-a`, `-bc`)
	 */
	export const SHORT = "short" as const;
	export type SHORT = typeof SHORT;

	/**
	 * GNU-style (e.g.: `--foo`, `--bar=baz`)
	 */
	export const LONG = "long" as const;
	export type LONG = typeof LONG;
}

export type OptionStyle = typeof OptionStyle[keyof typeof OptionStyle];

deepFreeze(OptionStyle);
