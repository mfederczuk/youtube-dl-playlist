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

import { existsSync, PathLike, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import * as path from "path";
import { inspect } from "util";
import { parseArgs } from "./argParser";
import { DeepMutable } from "./mutable";
import { Playlist } from "./playlist";

const scriptName = path.basename(process.argv[1]);

let processingOptions = true;

process.argv.slice(2).forEach((arg) => {
	if(processingOptions) {
		if(arg === "--") {
			processingOptions = false;
			return;
		}
	}
});


export function check(
	playlistJsonFilePath: PathLike,
	options?: {
		readonly warnings?: ("suppress" | "show" | "fail");
		readonly color?: ("always" | "auto" | "never");
	}
): number {
	const {
		warnings,
		color
	} = {
		warnings: options?.warnings ?? "show",
		color: options?.color ?? "auto"
	};

	// TODO
	throw undefined;
}

/*
parseArgs(
	scriptName,
	process.argv.slice(2),
	(arg) => {
		if(typeof(arg) === "string") {
			arg;
		} else {
			arg;
		}
	}
);

class Usage {
	readonly usageStrings: readonly string[];

	constructor(usageString: string);
	constructor(usageStrings: readonly string[]);
	constructor(usageStringOrStrings: (string | readonly string[])) {
		if(typeof(usageStringOrStrings) === "string") {
			usageStringOrStrings = [usageStringOrStrings];
		}

		this.usageStrings = usageStringOrStrings;
	}

	toString(scriptName?: string) {
		return "usage: " + this.usageStrings
			.map((usageString) => (`${scriptName} ${usageString}`))
			.join("\n   or: ");
	}
}

class HelpText {
	constructor(
		readonly description: string,
		readonly sections: [name: string, text: string]
	) {}

	toString(scriptName?: string) {
		return this.description.replace(/\n/g, "\n    ");
	}
}

class Command {
	constructor(
		readonly name: string,
		readonly usage: Usage,
		readonly helpText: HelpText,
		readonly func: (...args: unknown[]) => number
	) {}

	toString(scriptName?: string) {
		return "usage: " + this.usageStrings.map((usageString) => (`${scriptName} ${usageString}`)).join("\n   or: ");
	}
}

class CommandAlias implements Command {
	readonly func: (...args: unknown[]) => number;

	constructor(
		readonly name: string,
		readonly command: Command,
		...args: string[]
	) {


		this.func = (...args: unknown[]) => {
		};
	}
}

const commands = new Map<string, ((...args: string[]) => number)>();
function getCommand(commandName: string): ((...args: string[]) => number) {
	const commandFunc = commands.get(commandName);

	if(!(commandFunc instanceof Function)) {
		console.error(`${scriptName}: ${commandName}: unknown command`);
		process.exit(8);
	}

	return commandFunc;
}

commands.set("redownload", (...args: string[]) => getCommand("download")("--replace", ...args));
commands.set("sort", (...args: string[]) => getCommand("rewrite")("--sort=asc", ...args));

// function parsePlaylistFile(playlistJsonFilePath: PathLike): 0 {
// 	if(existsSync(playlistJsonFilePath)) {
// 		// TODO
// 		process.exit();
// 	}

// 	return Playlist.validateJSON(readFileSync(playlistJsonFilePath));
// }

function check(
	playlistJsonFilePath: PathLike,
	options?: {
		readonly warnings?: ("suppress" | "show" | "fail");
		readonly color?: ("always" | "auto" | "never");
	}
): number {
	const {
		warnings,
		color
	} = {
		warnings: options?.warnings ?? "show",
		color: options?.color ?? "auto"
	};

	// TODO
	throw undefined;
}

function view(
	playlistJsonFilePath: PathLike,
	options?: {
		readonly format?: string;
		readonly color?: ("always" | "auto" | "never");
	}
) {
	const {
		format,
		color
	} = {
		format: options?.format ?? "%t - %a",
		color: options?.color ?? "auto"
	};

	const checkExitCode = check(playlistJsonFilePath, { warnings: "suppress", color });
	if(checkExitCode !== 0) {
		return checkExitCode;
	}

	// TODO
	throw undefined;
}

function download(
	playlistJsonFilePath: PathLike,
	options?: {
		readonly highEffort?: boolean;
		readonly replace?: boolean;
		readonly outputDirectoryPath?: PathLike;
	}
) {
	const {
		highEffort,
		replace,
		outputDirectoryPath
	} = {
		highEffort: options?.highEffort ?? false,
		replace: options?.replace ?? false,
		outputDirectoryPath: options?.outputDirectoryPath
	};

	// TODO
	throw undefined;
}

function rewrite(
	format: ("compact" | "4spaces" | "tab"),
	playlistJsonFilePath: PathLike,
	options?: {
		readonly sort?: ("asc" | "desc");
	}
) {
	const { sort } = { sort: options?.sort ?? "asc" };

	// TODO
	throw undefined;
}
*/

// ================================================================================================================== //


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
		[hasYoutubeDl, "youtube-dl"],
		[hasCurl, "curl"],
		[hasFfmpeg, "ffmpeg"]
	].forEach(([hasProgram, program]) => {
		if(!hasProgram) {
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
