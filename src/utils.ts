/*
 * Copyright (c) 2021 Michael Federczuk
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface String {
	removePrefix(prefix: string): string;
	removeSuffix(suffix: string): string;
}

String.prototype.removePrefix = function(this: string, prefix: string): string {
	if(this.startsWith(prefix)) {
		return this.substring(prefix.length);
	}

	return this;
};

String.prototype.removeSuffix = function(this: string, suffix: string): string {
	if(this.endsWith(suffix)) {
		return this.substring(0, (this.length - suffix.length));
	}

	return this;
};
