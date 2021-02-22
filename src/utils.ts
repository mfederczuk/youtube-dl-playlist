/*
 * Node.js program to download a JSON playlist using youtube-dl.
 * Copyright (C) 2021  Michael Federczuk
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
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
