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
import * as fs from "fs";
import Joi from "joi";
import * as nodeId3 from "node-id3";
import * as path from "path";
import "./utils";

export interface TrackJSON {
	title: string;
	artist: string;
	// eslint-disable-next-line camelcase
	featured_artists?: string[];
	album?: string;
	nr?: number;
	year?: number;
	comments?: (string | string[]);
	url?: string;
	// eslint-disable-next-line camelcase
	fallback_urls?: string[];
	file?: string;
	// eslint-disable-next-line camelcase
	fallback_files?: string[];
	other?: unknown;
}

function trackJsonToTrackObject(json: TrackJSON): Track {
	const urls: URL[] = [];

	function addUrl(url: string, ytdlplScheme: ("curl" | "youtube-dl")) {
		urls.push(new URL(`ytdlpl-${ytdlplScheme}-${url}`));
	}

	if(typeof(json.file) === "string") {
		addUrl(json.file, "curl");
	}
	if(json.fallback_files instanceof Array) {
		json.fallback_files.forEach((fallbackFile) => {
			addUrl(fallbackFile, "curl");
		});
	}

	if(typeof(json.url) === "string") {
		addUrl(json.url, "youtube-dl");
	}
	if(json.fallback_urls instanceof Array) {
		json.fallback_urls.forEach((fallbackUrl) => {
			addUrl(fallbackUrl, "youtube-dl");
		});
	}

	let comments = json.comments;
	if(comments instanceof Array) {
		comments = comments.join("\n");
	}

	return new Track(
		urls,
		json.title,
		json.artist,
		json.featured_artists,
		json.album,
		json.nr,
		json.year,
		comments,
		json.other
	);
}

export const trackSchema = Joi.object({
	title: Joi.string().required(),
	artist: Joi.string().required(),
	// eslint-disable-next-line camelcase
	featured_artists: Joi.array()
		.items(Joi.link("...artist"))
		.min(1).warn()
		.optional(),
	album: Joi.string().optional(),
	nr: Joi.number()
		.integer().warn()
		.positive().warn()
		.optional(),
	year: Joi.number()
		.integer().warn()
		.greater(1500).warn()
		.optional(),
	comments: Joi.alternatives(
		Joi.string()
			.allow("")
			.custom((value, { warn }) => {
				if(value === "") {
					warn("string.empty");
				}
				return value;
			}),
		Joi.array()
			.items(
				Joi.string()
					.allow("")
					.custom((value, { warn }) => {
						if(value === "") {
							warn("string.empty");
						}
						return value;
					})
					.pattern(/\n/, { invert: true }).warn()
			)
			.min(1).warn()
	).optional(),
	url: Joi.string()
		.uri().warn()
		.optional(),
	// eslint-disable-next-line camelcase
	fallback_urls: Joi.array()
		.items(Joi.link("...url"))
		.min(1).warn()
		.optional(),
	file: Joi.string()
		.uri().warn()
		.optional(),
	// eslint-disable-next-line camelcase
	fallback_files: Joi.array()
		.items(Joi.link("...file"))
		.min(1).warn()
		.optional(),
	other: Joi.any().optional()
}).required().custom(trackJsonToTrackObject);

export interface TrackValidationResult extends Joi.ValidationResult {
	value: (Track | undefined);
}

function retrieveProgramFromUrl(url: URL): [program: ("youtube-dl" | "curl"), url: string] {
	for(const program of ["youtube-dl", "curl"] as ["youtube-dl", "curl"]) {
		if(url.protocol.startsWith(`ytdlpl-${program}-`)) {
			return [program, url.toString().removePrefix(`ytdlpl-${program}-`)];
		}
	}

	throw new Error("Invalid scheme");
}

function downloadUrl(basename: string, url: URL, retry: number, maxRetries: number): boolean {
	if(typeof(basename) !== "string") {
		throw new TypeError("'basename' argument must be a string");
	}

	if(!(url instanceof URL)) {
		throw new TypeError("'url' argument must be a URL");
	}

	if(typeof(retry) !== "number") {
		throw new TypeError("'retry' argument must be a number");
	}

	if(typeof(maxRetries) !== "number") {
		throw new TypeError("'maxRetries' argument must be a number");
	}

	const [program, correctUrl] = retrieveProgramFromUrl(url);

	if(program === "youtube-dl") {
		const ytdl = spawnSync(
			"youtube-dl",
			[
				"--format=bestaudio",
				"-x",
				"--audio-format=mp3",
				"--audio-quality=0",
				"--prefer-ffmpeg",
				"-o", `${basename.replace(/%/g, "%%")}.%(ext)s`,
				correctUrl
			]
		);

		if(ytdl.status === 0) {
			return true;
		}
	} else if(program === "curl") {
		const curl = spawnSync(
			"curl",
			[
				"-o", path.basename(url.pathname),
				correctUrl
			]
		);

		if(curl.status === 0) {
			return true;
		}
	}

	if(retry >= maxRetries) {
		return false;
	}

	return downloadUrl(basename, url, retry + 1, maxRetries);
}

function convertToMp3(inputFilename: string, outputBasename: string): boolean {
	const ffmpeg = spawnSync(
		"ffmpeg",
		[
			"-i", inputFilename,
			"-y",
			`${outputBasename}.mp3`
		]
	);

	fs.rmSync(inputFilename);

	return (ffmpeg.status === 0);
}

export class Track {
	constructor(
		readonly urls: readonly URL[],
		readonly title: string,
		readonly artist: string,
		readonly featuredArtists?: readonly string[],
		readonly album?: string,
		readonly nr?: number,
		readonly year?: number,
		readonly comments?: string,
		readonly other?: unknown
	) {
		if(!(urls instanceof Array)) {
			throw new TypeError("'urls' argument must be an array");
		}
		if(urls.length === 0) {
			throw new Error("'urls' argument must not be empty");
		}
		urls.forEach((url) => {
			if(!(url instanceof URL)) {
				throw new TypeError("All items of 'urls' argument must be URLs");
			}
		});
		urls.forEach((url) => {
			if(!url.protocol.startsWith("ytdlpl-youtube-dl-") &&
				!url.protocol.startsWith("ytdlpl-curl-")) {
				throw new Error("Invalid URI scheme");
			}
		});

		if(typeof(title) !== "string") {
			throw new TypeError("'title' argument must be a string");
		}

		if(typeof(artist) !== "string") {
			throw new TypeError("'artist' argument must be a string");
		}

		if(featuredArtists !== undefined) {
			if(!(featuredArtists instanceof Array)) {
				throw new TypeError("'featuredArtists' argument must be an array");
			}

			featuredArtists.forEach((featuredArtist) => {
				if(typeof(featuredArtist) !== "string") {
					throw new TypeError("All items of 'featuredArtists' argument must be strings");
				}
			});
		}

		if(album !== undefined && typeof(album) !== "string") {
			throw new TypeError("'album' argument must be a string");
		}

		if(nr !== undefined && typeof(nr) !== "number") {
			throw new TypeError("'number' argument must be a number");
		}

		if(year !== undefined && typeof(year) !== "number") {
			throw new TypeError("'year' argument must be a number");
		}

		if(comments !== undefined) {
			if(typeof(comments) !== "string") {
				throw new TypeError("'comments' argument must be a string");
			}

			this.comments = comments.trim();
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

	get url(): URL {
		return this.urls[0];
	}

	get fallbackUrls(): URL[] {
		return this.urls.slice(1);
	}

	download(basename: string): Promise<void> {
		if(typeof(basename) !== "string") {
			throw new TypeError("Argument must be a string");
		}

		return new Promise((resolve, reject) => {
			const successfulUrl = this.downloadOnly(basename);

			if(!(successfulUrl instanceof URL)) {
				reject();
				return;
			}

			if(retrieveProgramFromUrl(successfulUrl)[0] === "curl" &&
				!convertToMp3(path.basename(successfulUrl.pathname), basename)) {

				reject();
				return;
			}

			this.writeId3v2Tags(successfulUrl, `${basename}.mp3`).then(resolve, reject);
		});
	}

	private downloadOnly(basename: string): (URL | undefined) {
		if(typeof(basename) !== "string") {
			throw new TypeError("Argument must be a string");
		}

		if(this.urls.length === 1) {
			const success = downloadUrl(basename, this.url, 0, 5);
			return (success ? this.url : undefined);
		}

		for(const url of this.urls) {
			if(downloadUrl(basename, url, 0, 3)) {
				return url;
			}
		}

		return undefined;
	}

	private async writeId3v2Tags(usedUrl: URL, filename: string) {
		if(!(usedUrl instanceof URL)) {
			throw new TypeError("'usedUrl' argument must be a URL");
		}

		if(typeof(filename) !== "string") {
			throw new TypeError("'filename' argument must be a string");
		}

		const res = nodeId3.write(
			{
				title: this.title,
				artist: this.artist,
				album: this.album,
				trackNumber: this.nr?.toString(),
				year: this.year?.toString(),
				comment: {
					language: "eng",
					text: (this.comments?.replace(/$/, "\n\n") ?? "") +
						"Downloaded using github.com/mfederczuk/youtube-dl-playlist"
				},
				userDefinedUrl: [{
					description: "Source URL",
					url: usedUrl.toString()
				}]
			},
			filename
		);

		if(res instanceof Error) {
			throw res;
		}
	}

	compare(other: Track): number {
		if(!(other instanceof Track)) {
			throw new TypeError("Argument must be a Track");
		}

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
		let comments: (string | string[] | undefined) = this.comments?.trim()?.split(/\n/);
		if(comments instanceof Array && comments.length === 1) {
			comments = comments[0];
		}

		const urls: string[] = [], files: string[] = [];
		this.urls.forEach((url) => {
			const [program, correctUrl] = retrieveProgramFromUrl(url);

			if(program === "youtube-dl") {
				urls.push(correctUrl);
			} else if(program === "curl") {
				files.push(correctUrl);
			}
		});

		const url = urls.splice(0, 1)[0] as (string | undefined);
		const file = files.splice(0, 1)[0] as (string | undefined);

		return {
			title: this.title,
			artist: this.artist,
			// eslint-disable-next-line camelcase
			...(this.featuredArtists !== undefined ? { featured_artists: [...this.featuredArtists] } : {}),
			...(this.album !== undefined ? { album: this.album } : {}),
			...(this.nr !== undefined ? { nr: this.nr } : {}),
			...(this.year !== undefined ? { year: this.year } : {}),
			...(comments !== undefined ? { comments } : {}),
			...(url !== undefined ? { url } : {}),
			// eslint-disable-next-line camelcase
			...(urls.length > 0 ? { fallback_urls: urls } : {}),
			...(file !== undefined ? { file } : {}),
			// eslint-disable-next-line camelcase
			...(files.length > 0 ? { fallback_files: files } : {}),
			...(this.other !== undefined ? { other: this.other } : {})
		};
	}

	equals(other: unknown): boolean {
		return (this === other) ||
			(other instanceof Track &&
				this.urls.length === other.urls.length &&
				this.urls.every((ourUrl, i) => (ourUrl === other.urls[i])) &&
				this.title === other.title &&
				this.artist === other.title &&
				this.album === other.album &&
				this.nr === other.nr &&
				this.year === other.year);
	}
}
