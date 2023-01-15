// SPDX-License-Identifier: CC0-1.0

export function filterInstance<T, R>(array: readonly T[], constructor: new(...args: never[]) => R): R[] {
	const filtered: R[] = [];

	for (const item of array) {
		if (item instanceof constructor) {
			filtered.push(item);
		}
	}

	return filtered;
}

export function compareEach<T>(
	array: readonly T[],
	consumer: (itemA: T, itemB: T, indexA: number, indexB: number, array: readonly T[]) => void,
) {
	for (let i: number = 0; i < array.length; ++i) {
		const itemA: T = array[i];

		for (let j: number = (i + 1); j < array.length; ++j) {
			const itemB: T = array[j];

			consumer(itemA, itemB, i, j, array);
		}
	}
}
