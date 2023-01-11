// SPDX-License-Identifier: CC0-1.0

export type DeepReadonly<T> = {
	readonly [P in keyof T]: DeepReadonly<T[P]>;
};

export type Char = (string & {
	readonly length: 1;
	readonly 0: Char;

	codePointAt(pos: 0): number;
	charAt(pos: 0): Char;
});
