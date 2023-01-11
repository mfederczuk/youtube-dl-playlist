// SPDX-License-Identifier: CC0-1.0

export function quoteString(str: string): string {
	return ("\"" + str.replace(/[\\"]/g, "\\$&") + "\"");
}
