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

import { fork } from "child_process";
import Joi from "joi";
import * as os from "os";
import { inspect } from "util";
import Deferred from "./Deferred";
import Track, { TrackJSON, trackSchema } from "./Track";


interface Stringable {
	toString(): string;
}

type BasenameCreator = (track: Track) => (string | undefined);

function turnToBasename(string: string): string {
	return string
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^(-)+/, "")
		.replace(/(-)+$/, "");
}

const basenameCreators: BasenameCreator[] = (
	[
		(track) => [track.title],
		(track) => [track.artist, track.title],
		(track) => [track.artist, track.album, track.title],
		(track) => [track.artist, track.album, track.title, track.nr],
		(track) => [track.artist, track.title, track.year],
		(track) => [track.artist, track.album, track.title, track.year],
		(track) => [track.artist, track.album, track.title, track.nr, track.year]
	] as ((track: Track) => (Stringable | undefined)[])[]
).map((func) => (track) => {
	const parts = func(track);

	if(parts.some((part) => (part === undefined))) return undefined;

	return (parts as Stringable[])
		.map((part) => (part.toString()))
		.map(turnToBasename)
		.join("_");
});


export type PlaylistJSON = TrackJSON[];

export const playlistSchema = Joi.array()
	.items(trackSchema)
	.min(1).warn()
	.required()
	.custom((value: Track[]) => (new Playlist(value)));

export interface PlaylistValidationResult extends Joi.ValidationResult {
	value: (Playlist | undefined);
}

function downloadTracks(
	entries: [basename: string, track: Track][],
	inChildProcess: boolean
): Map<string, PromiseLike<void>> {

	if(entries.length === 0) return new Map();

	if(!inChildProcess) {
		return entries.reduce(
			(map, [basename, track]) => {
				map.set(basename, track.download(basename));
				return map;
			},
			new Map<string, PromiseLike<void>>()
		);
	}

	const deferredMap = entries.reduce(
		(map, [basename]) => {
			map.set(basename, new Deferred());
			return map;
		},
		new Map<string, Deferred<void, void>>()
	);

	const childProcess = fork(`${__dirname}/downloadTracks`);

	childProcess.on("message", (msg: [basename: string, success: boolean]) => {
		const basename = msg[0];
		const action = (msg[1] ? "resolve" : "reject");

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		deferredMap.get(basename)![action]();
	});

	childProcess.send(entries.map(([basename, track]) => ([basename, track.toJSON()])));

	return deferredMap;
}

export default class Playlist extends Map<string, Track> {
	constructor(tracks?: Iterable<Track>) {
		super();

		if(tracks !== undefined) this.add(...tracks);
	}

	static validateJSON(value: unknown): PlaylistValidationResult {
		return playlistSchema.validate(value);
	}

	add(...newTracks: Track[]): void {
		newTracks.forEach((newTrack) => (this.addNewTrack(newTrack)));
	}

	// eslint-disable-next-line @typescript-eslint/no-inferrable-types
	private addNewTrack(newTrack: Track, filenameCreatorIndex: number = 0) {
		for(const existingTrack of this.values()) {
			if(newTrack.equals(existingTrack)) {
				return;
			}
		}

		const basenameCreator = basenameCreators[filenameCreatorIndex] as (BasenameCreator | undefined);

		if(basenameCreator === undefined) {
			throw new Error(`Could not add track: ${inspect(newTrack)}`);
		}

		const newBasename = basenameCreator(newTrack);

		if(newBasename === undefined) {
			this.addNewTrack(newTrack, filenameCreatorIndex + 1);
			return;
		}

		const foundTracks: Track[] = [];
		for(const [existingBasename, existingTrack] of this.entries()) {
			if(basenameCreator(existingTrack) === newBasename) {
				foundTracks.push(existingTrack);
				this.delete(existingBasename);
			}
		}

		if(foundTracks.length === 0) {
			this.set(newBasename, newTrack);
			return;
		}

		++filenameCreatorIndex;
		[newTrack, ...foundTracks].forEach((track) => (this.addNewTrack(track, filenameCreatorIndex)));
	}

	/**
	 * @param highEffortMode
	 *        High effort mode will attempt to download the tracks faster at the cost of more system resources.\
	 *        In this mode, it is possible that more child process will be created than the number logical cores on the
	 *        system.
	 */
	// eslint-disable-next-line @typescript-eslint/no-inferrable-types
	download(highEffortMode: boolean = false): Map<string, PromiseLike<void>> {
		const logicalCoreCount = os.cpus().length;

		if(!highEffortMode) {
			const possiblePhysicalCoreCount = Math.ceil(logicalCoreCount / 2);

			if(possiblePhysicalCoreCount < 2) {
				return downloadTracks([...this.entries()], false);
			}

			return this.downloadInChildProcesses(possiblePhysicalCoreCount);
		}

		const minAmountOfChildProcesses = (() => {
			const limits = [20, 50, 100, 200, 500, 750, 1000, 2000];

			for(let i = 0; i < limits.length; ++i) {
				if(this.size <= limits[i]) return ((i + 1) * 2);
			}

			return (limits.length * 2);
		})();

		const amountOfChildProcesses = Math.max(minAmountOfChildProcesses, logicalCoreCount);

		return this.downloadInChildProcesses(amountOfChildProcesses);
	}

	private downloadInChildProcesses(amountOfChildProcesses: number): Map<string, PromiseLike<void>> {
		const trackAmountsForChildProcesses: readonly number[] = (() => {
			const array = new Array<number>(amountOfChildProcesses).fill(Math.min(this.size / amountOfChildProcesses));

			for(let i = 0; i < (this.size % amountOfChildProcesses); ++i) {
				++(array[i]);
			}

			return array;
		})();

		const entries = [...this.entries()];

		return trackAmountsForChildProcesses
			.map((trackAmountForChildProcess) => {
				return downloadTracks(entries.splice(0, trackAmountForChildProcess), true);
			})
			.reduce(
				(flattenedMap, map) => {
					map.forEach((promiseLike, basename) => {
						flattenedMap.set(basename, promiseLike);
					});
					return flattenedMap;
				},
				new Map<string, PromiseLike<void>>()
			);
	}

	toJSON(): PlaylistJSON {
		return [...this.values()]
			.sort((a, b) => (a.compare(b)))
			.map((track) => (track.toJSON()));
	}
}
