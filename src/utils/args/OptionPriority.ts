// SPDX-License-Identifier: CC0-1.0

import { deepFreeze } from "@mfederczuk/deeptools";

export namespace OptionPriority {
	export const NORMAL = "normal" as const;
	export type NORMAL = typeof NORMAL;

	export const HIGH = "high" as const;
	export type HIGH = typeof HIGH;
}

export type OptionPriority = typeof OptionPriority[keyof typeof OptionPriority];

deepFreeze(OptionPriority);
