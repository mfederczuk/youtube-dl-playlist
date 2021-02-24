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

import { inspect, InspectOptionsStylized } from "util";

export class Deferred<T = unknown, E = (unknown | undefined)> implements PromiseLike<T> {
	private result?: (readonly [true, T] | readonly [false, E]);
	private readonly onResolveCallbacks: ((value: T) => void)[] = [];
	private readonly onRejectCallbacks: ((reason: E) => void)[] = [];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static fromPromise<T>(promise: PromiseLike<T>): Deferred<T, any> {
		if(typeof(promise) !== "object" || !("then" in promise) || !(promise.then instanceof Function)) {
			throw new TypeError("Argument must be a thenable object");
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const deferred = new Deferred<T, any>();

		promise.then(
			(value) => (deferred.resolve(value)),
			(reason) => (deferred.reject(reason))
		);

		return deferred;
	}

	static resolved<T = unknown, E = (unknown | undefined)>(value: T): Deferred<T, E> {
		const deferred = new Deferred<T, E>();
		deferred.resolve(value);
		return deferred;
	}

	static rejected<T = unknown, E = (unknown | undefined)>(reason: E): Deferred<T, E> {
		const deferred = new Deferred<T, E>();
		deferred.reject(reason);
		return deferred;
	}

	resolve(value: T): void {
		if(this.result !== undefined) {
			return;
		}

		this.result = [true, value];

		this.onResolveCallbacks
			.splice(0)
			.forEach((onResolveCallback) => (onResolveCallback(value)));

		this.onRejectCallbacks.splice(0);
	}

	reject(reason: E): void {
		if(this.result !== undefined) {
			return;
		}

		this.result = [false, reason];

		this.onResolveCallbacks.splice(0);

		this.onRejectCallbacks
			.splice(0)
			.forEach((onRejectCallback) => (onRejectCallback(reason)));
	}

	onResolve(callback: (value: T) => void): void {
		if(!(callback instanceof Function)) {
			throw new TypeError("Argument must be a function");
		}

		if(this.result !== undefined) {
			if(this.result[0]) {
				callback(this.result[1]);
			}

			return;
		}

		this.onResolveCallbacks.push(callback);
	}

	onReject(callback: (reason: E) => void): void {
		if(!(callback instanceof Function)) {
			throw new TypeError("Argument must be a function");
		}

		if(this.result !== undefined) {
			if(!this.result[0]) {
				callback(this.result[1]);
			}

			return;
		}

		this.onRejectCallbacks.push(callback);
	}

	then<TResult1, TResult2>(
		onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
		onrejected?: ((reason: E) => TResult2 | PromiseLike<TResult2>) | null
	): Deferred<TResult1 | TResult2> {
		const newDeferred = new Deferred<TResult1 | TResult2>();

		if(onfulfilled !== undefined && onfulfilled !== null) {
			if(!(onfulfilled instanceof Function)) {
				throw new TypeError("'onfulfilled' argument must be a function");
			}

			this.onResolve((value) => {
				try {
					const result = onfulfilled(value);

					if(typeof(result) === "object" && "then" in result && result.then instanceof Function) {
						result.then(
							(value) => newDeferred.resolve(value),
							(reason) => newDeferred.reject(reason)
						);
					} else {
						newDeferred.resolve(result as TResult1);
					}
				} catch(err) {
					newDeferred.reject(err);
				}
			});
		}

		if(onrejected !== undefined && onrejected !== null) {
			if(!(onrejected instanceof Function)) {
				throw new TypeError("'onfulfilled' argument must be a function");
			}

			this.onReject((reason) => {
				try {
					const result = onrejected(reason);

					if(typeof(result) === "object" && "then" in result && result.then instanceof Function) {
						result.then(
							(value) => newDeferred.resolve(value),
							(reason) => newDeferred.reject(reason)
						);
					} else {
						newDeferred.resolve(result as TResult2);
					}
				} catch(err) {
					newDeferred.reject(err);
				}
			});
		}

		return newDeferred;
	}

	toPromise(): Promise<T> {
		return new Promise((resolve, reject) => {
			this.onResolve(resolve);
			this.onReject(reject);
		});
	}

	[inspect.custom](_: number, options: InspectOptionsStylized): string {
		function specialStyle(text: string): string {
			if(typeof(options) !== "object" || !("stylize" in options) || !(options.stylize instanceof Function)) {
				throw new TypeError("'options' argument must be an object with a 'stylize' function");
			}

			if(options.colors !== true) {
				return text;
			}

			return options.stylize(text, "special");
		}

		if(this.result === undefined) {
			return `Deferred { ${specialStyle("<pending>")} }`;
		}

		if(this.result[0]) {
			return `Deferred { ${inspect(this.result[1], options)} }`;
		}

		return `Deferred { ${specialStyle("<rejected>")} ${inspect(this.result[1], options)} }`;
	}
}
