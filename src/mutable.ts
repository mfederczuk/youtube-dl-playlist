// SPDX-License-Identifier: CC0-1.0

export type Mutable<T> = {
	-readonly [P in keyof T]: T[P];
};

export type DeepMutable<T> = {
	-readonly [P in keyof T]: DeepMutable<T[P]>;
};
