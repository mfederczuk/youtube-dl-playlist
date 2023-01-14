// SPDX-License-Identifier: CC0-1.0

import type util from "util";
import type { InspectOptionsStylized } from "util";

export interface Inspectable {
	[util.inspect.custom](
		depth: number,
		options: InspectOptionsStylized,
		inspect: typeof util.inspect,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	): any;
}
