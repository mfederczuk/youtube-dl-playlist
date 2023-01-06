/*
 * Copyright (c) 2021 Michael Federczuk
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Track, TrackJSON } from "./track";

process.on("message", (entries: [basename: string, track: TrackJSON][]) => {
	if(!(entries instanceof Array)) {
		throw new TypeError("Received message must be an array");
	}

	entries.forEach((entry) => {
		if(typeof(entry?.[0]) !== "string") {
			throw new TypeError("First element of items of received message must be a string");
		}
	});

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
				if(finishedCount >= downloads.size) {
					process.disconnect();
				}
			});
	});
});
