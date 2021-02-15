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

import { spawnSync } from "child_process";
import Joi from "joi";
import * as nodeId3 from "node-id3";

export interface TrackJSON {
	title: string;
	artist: string;
	album?: string;
	nr?: number;
	year?: number;
	url: string;
	// eslint-disable-next-line camelcase
	fallback_urls?: string[];
}

export const trackSchema = Joi.object({
	title: Joi.string().required(),
	artist: Joi.string().required(),
	album: Joi.string().optional(),
	nr: Joi.number()
		.integer().warn()
		.positive().warn()
		.optional(),
	year: Joi.number()
		.integer().warn()
		.greater(1500).warn()
		.optional(),
	url: Joi.string()
		.uri().warn()
		.required(),
	// eslint-disable-next-line camelcase
	fallback_urls: Joi.array()
		.items(Joi.link("...url"))
		.min(1).warn()
		.optional()
}).required().custom((value: TrackJSON) => new Track(
	[value.url, ...(value.fallback_urls ?? [])],
	value.title,
	value.artist,
	value.album,
	value.nr,
	value.year
));

export interface TrackValidationResult extends Joi.ValidationResult {
	value: (Track | undefined);
}

function downloadUrl(basename: string, url: string, retry: number, maxRetries: number): boolean {
	const ytdl = spawnSync(
		"youtube-dl",
		[
			"--format=bestaudio",
			"-x",
			"--audio-format=mp3",
			"--audio-quality=0",
			"--prefer-ffmpeg",
			"-o", `${basename.replace(/%/g, "%%")}.%(ext)s`,
			url
		]
	);

	if(ytdl.status === 0) {
		return true;
	}

	if(retry >= maxRetries) {
		return false;
	}

	return downloadUrl(basename, url, retry + 1, maxRetries);
}

export default class Track {
	constructor(
		readonly urls: readonly string[],
		readonly title: string,
		readonly artist: string,
		readonly album?: string,
		readonly nr?: number,
		readonly year?: number
	) {
		if(urls.length === 0) {
			throw new Error("At least one URL required");
		}
	}

	static validateJSON(value: unknown): TrackValidationResult {
		return trackSchema.validate(value);
	}

	static fromJSON(value: unknown): Track {
		const res = Track.validateJSON(value);

		if(res.error !== undefined) {
			throw res.error;
		}

		if(res.value === undefined) {
			throw new Error("Could not validate track JSON");
		}

		return res.value;
	}

	get url(): string {
		return this.urls[0];
	}

	get fallbackUrls(): string[] {
		return this.urls.slice(1);
	}

	download(basename: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if(this.downloadOnly(basename)) {
				this.writeId3v2Tags(`${basename}.mp3`).then(resolve, reject);
			} else {
				reject();
			}
		});
	}

	private downloadOnly(basename: string): boolean {
		if(this.urls.length === 1) {
			return downloadUrl(basename, this.url, 0, 5);
		}

		for(const url of this.urls) {
			if(downloadUrl(basename, url, 0, 3)) {
				return true;
			}
		}

		return false;
	}

	private async writeId3v2Tags(filename: string) {
		const res = nodeId3.write(
			{
				title: this.title,
				artist: this.artist,
				album: this.album,
				trackNumber: this.nr?.toString(),
				year: this.year?.toString()
			},
			filename
		);

		if(res instanceof Error) {
			throw res;
		}
	}

	compare(other: Track): number {
		if(this.artist !== other.artist) {
			return this.artist.localeCompare(other.artist);
		}

		if(this.album !== other.album) {
			if(this.album === undefined) {
				return 1;
			}

			if(other.album === undefined) {
				return -1;
			}

			return this.album.localeCompare(other.album);
		}

		if(this.album === undefined) {
			if(this.title !== other.title) {
				return this.title.localeCompare(other.title);
			}

			if(this.nr !== other.nr) {
				if(this.nr === undefined) {
					return 1;
				}

				if(other.nr === undefined) {
					return -1;
				}

				return (this.nr - other.nr);
			}
		} else {
			if(this.nr !== other.nr) {
				if(this.nr === undefined) {
					return 1;
				}

				if(other.nr === undefined) {
					return -1;
				}

				return (this.nr - other.nr);
			}

			if(this.title !== other.title) {
				return this.title.localeCompare(other.title);
			}
		}

		if(this.year !== other.year) {
			if(this.year === undefined) {
				return 1;
			}

			if(other.year === undefined) {
				return -1;
			}

			return (this.year - other.year);
		}

		return 0;
	}

	toJSON(): TrackJSON {
		return {
			title: this.title,
			artist: this.artist,
			...(this.album !== undefined ? { album: this.album } : {}),
			...(this.nr !== undefined ? { nr: this.nr } : {}),
			...(this.year !== undefined ? { year: this.year } : {}),
			url: this.url,
			// eslint-disable-next-line camelcase
			...(this.fallbackUrls.length > 0 ? { fallback_urls: this.fallbackUrls } : {})
		};
	}

	equals(other: Track): boolean {
		return (this === other) ||
			(this.urls.length === other.urls.length &&
				this.urls.every((ourUrl, i) => (ourUrl === other.urls[i])) &&
				this.title === other.title &&
				this.artist === other.title &&
				this.album === other.album &&
				this.nr === other.nr &&
				this.year === other.year);
	}
}
