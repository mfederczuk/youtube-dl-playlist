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

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import * as path from "path";
import { DeepMutable } from "./mutable";
import { Playlist } from "./playlist";

const scriptName = path.basename(process.argv[1]);
const usage = `usage: ${scriptName} [--download [--high-effort]] [--sort] [--compact|--pretty=(tab|<number_of_spaces>)] <playlist_file>`;

interface CliInput {
	readonly filePath?: string;
	readonly download: (false | {
		readonly highEffort: boolean;
	});
	readonly rewrite: (false | {
		readonly format?: ("compact" | "tab" | number);
		readonly sort: boolean;
	});
}

const cliInput: CliInput = process.argv.slice(2).reduce((cliInput, arg) => {
	if(cliInput.processOptions && arg.startsWith("--")) {
		if(arg === "--") {
			cliInput.processOptions = false;
		} else if(arg === "--download") {
			if(cliInput.download === false) {
				cliInput.download = { highEffort: false };
			}
		} else if(arg === "--high-effort") {
			if(cliInput.download === false) {
				cliInput.download = { highEffort: true };
			} else {
				cliInput.download.highEffort = true;
			}
		} else if(arg === "--compact") {
			if(cliInput.rewrite === false) {
				cliInput.rewrite = { format: "compact", sort: false };
			} else {
				cliInput.rewrite.format = "compact";
			}
		} else if(arg === "--sort") {
			if(cliInput.rewrite === false) {
				cliInput.rewrite = { sort: true };
			} else {
				cliInput.rewrite.sort = true;
			}
		} else {
			const match = arg.match(/^--pretty=(tab|\d+)$/);

			if(match === null) {
				console.error(`${scriptName}: ${arg}: invalid option`);
				console.error(usage);
				process.exit(5);
			}

			const optArg = match[1];

			if(optArg === "tab") {
				if(cliInput.rewrite === false) {
					cliInput.rewrite = { format: "tab", sort: false };
				} else {
					cliInput.rewrite.format = "tab";
				}
			} else {
				const spaces = Number(optArg);
				if(cliInput.rewrite === false) {
					cliInput.rewrite = { format: spaces, sort: false };
				} else {
					cliInput.rewrite.format = spaces;
				}
			}
		}
	} else if(cliInput.filePath === undefined) {
		cliInput.filePath = arg;
	} else {
		console.error(`${scriptName}: too many arguments`);
		console.error(usage);
		process.exit(4);
	}

	return cliInput;
}, {
	filePath: undefined,
	download: false,
	rewrite: false,
	processOptions: true
} as (DeepMutable<CliInput> & { processOptions: boolean; }));

if(cliInput.download === false && cliInput.rewrite === false) {
	console.error(`${scriptName}: either the --download, --compact, --pretty or --sort options must be given`);
	console.error(usage);
	process.exit(13);
}

if(cliInput.rewrite !== false && cliInput.rewrite.format === undefined) {
	console.error(`${scriptName}: if the --sort option is given, either the --compact or --pretty options must be given as well`);
	console.error(usage);
	process.exit(14);
}

if(cliInput.filePath === undefined) {
	console.error(`${scriptName}: missing argument: <playlist_file>`);
	console.error(usage);
	process.exit(3);
}

if(!existsSync(cliInput.filePath)) {
	console.error(`${scriptName}: ${cliInput.filePath}: no such file`);
	process.exit(24);
}

const playlistJson = JSON.parse(readFileSync(cliInput.filePath).toString());
const validationResult = Playlist.validateJSON(playlistJson);

if(validationResult.error !== undefined) {
	console.error(`${scriptName}: ${cliInput.filePath}: ${validationResult.error.message}`);
	process.exit(48);
}

if(validationResult.warning !== undefined) {
	console.warn(`${cliInput.filePath}: ${validationResult.warning.message}`);
}

const playlist = validationResult.value;

if(playlist === undefined) {
	console.error(`${scriptName}: ${cliInput.filePath}: error validating playlist JSON`);
	process.exit(48);
}

if(cliInput.rewrite !== false) {
	const obj = (cliInput.rewrite.sort ? playlist.toJSON() : playlistJson);

	let space: (number | "\t" | undefined);
	if(cliInput.rewrite.format === "tab") {
		space = "\t";
	} else if(typeof(cliInput.rewrite.format) === "number") {
		space = cliInput.rewrite.format;
	}

	writeFileSync(cliInput.filePath, JSON.stringify(obj, undefined, space) + (space !== undefined ? "\n" : ""));
}

if(cliInput.download !== false) {
	const needsCurlAndFfmpeg = [...playlist.values()]
		.flatMap((track) => track.urls)
		.some((url) => url.protocol.startsWith("ytdlpl-curl-"));

	let hasYoutubeDl = false,
		hasCurl = false,
		hasFfmpeg = false;

	const pathDirs = process.env["PATH"]?.split(":");

	if(pathDirs instanceof Array) {
		outer: for(const pathDir of pathDirs) {
			if(!existsSync(pathDir) || !statSync(pathDir).isDirectory()) {
				continue;
			}

			for(const entry of readdirSync(pathDir)) {
				if(entry === "youtube-dl") hasYoutubeDl = true;
				if(entry === "curl") hasCurl = true;
				if(entry === "ffmpeg") hasFfmpeg = true;

				if(hasYoutubeDl && hasCurl && hasFfmpeg) {
					break outer;
				}
			}
		}
	}

	[
		[true, hasYoutubeDl, "youtube-dl"],
		[needsCurlAndFfmpeg, hasCurl, "curl"],
		[needsCurlAndFfmpeg, hasFfmpeg, "ffmpeg"]
	].forEach(([needsProgram, hasProgram, program]) => {
		if(needsProgram && !hasProgram) {
			console.error(`${scriptName}: ${program}: program missing`);
			process.exit(27);
		}
	});

	const downloads = playlist.download(cliInput.download.highEffort);

	let downloadsFinished = 0;

	function incrementFinishedDownload() {
		++downloadsFinished;

		if(downloadsFinished >= downloads.size) {
			console.log("All downloads finished");
		}
	}

	downloads.forEach((promise, basename) => {
		promise.then(
			() => {
				console.log(`${basename}: success`);
				incrementFinishedDownload();
			},
			() => {
				console.log(`${basename}: failure`);
				process.exitCode = 32;
				incrementFinishedDownload();
			}
		);
	});
}
