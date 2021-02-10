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

import Track, { TrackJSON } from "./Track";

process.on("message", (entries: [basename: string, track: TrackJSON][]) => {
	const downloads = entries.reduce(
		(map, [basename, track]) => {
			map.set(basename, Track.fromJSON(track).download(basename));
			return map;
		},
		new Map<string, Promise<void>>()
	);

	const finishedSendingPromises = [...downloads.entries()].map(
		([basename, downloadPromise]) => {
			return new Promise<void>((resolve, reject) => {
				const callback = (err: (Error | null)) => {
					if(err === null) {
						resolve();
					} else {
						reject(err);
					}
				};

				downloadPromise.then(
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					() => (process.send!([basename, true], undefined, undefined, callback)),
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					() => (process.send!([basename, false], undefined, undefined, callback))
				);
			});
		}
	);

	let finishedCount = 0;

	finishedSendingPromises.forEach((promise) => {
		promise
			.catch((reason) => (console.error("Error:", reason)))
			.finally(() => {
				++finishedCount;
				if(finishedCount >= downloads.size) process.disconnect();
			});
	});
});
