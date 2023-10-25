/*
 * Copyright (c) 2023 Michael Federczuk
 * SPDX-License-Identifier: MPL-2.0 AND Apache-2.0
 */

import { StringEnumDataType, StringDataType } from "./utils/args/DataType";
import { OperandDefinition } from "./utils/args/OperandDefinition";
import { OptionArgumentDefinition, OptionDefinition } from "./utils/args/OptionDefinition";
import { optIds } from "./utils/args/OptionIdentifier";
import { OptionPriority } from "./utils/args/OptionPriority";
import { CommandsUsage, RegularUsage } from "./utils/args/Usage";

export type CLI = {
	readonly execMode: "showHelp";
	readonly commandName?: ("download" | "sort");
} | {
	readonly execMode: "showVersionInfo";
} | {
	readonly execMode: "download";
	readonly replaceFiles?: boolean;
	readonly playlistFilePathname: string;
} | {
	readonly execMode: "sort";
	readonly style?: ("compact" | "tab" | "spaces:4");
	readonly playlistFilePathname: string;
};

// export type CLIParsingResult = {
// 	readonly type: "success";
// 	readonly cli: CLI;
// } | {
// 	readonly type: "missingOperand(s)";
// 	readonly commandName?: string;
// 	readonly specifiedOption?: SpecifiedOption;
// 	readonly operandNames: readonly [string, ...string[]];
// } | {
// 	readonly type: "excessiveOperand(s)";
// 	readonly commandName?: string;
// 	readonly specifiedOption?: SpecifiedOption;
// 	readonly count: number;
// } | {
// 	readonly type: "invalidOption";
// 	readonly commandName?: string;
// 	readonly invalidOptionIdentifier: OptionIdentifier;
// } | {
// 	readonly type: "unknownCommand";
// 	readonly commandName: string;
// } | {
// 	readonly type: "emptyOperand";
// 	readonly commandName?: string;
// 	readonly specifiedOption?: SpecifiedOption;
// 	readonly n?: number;
// };


namespace OptionDefinitions {
	export const help = new OptionDefinition(optIds`-h, --help`, OptionPriority.HIGH);
	export const versionInfo = new OptionDefinition(optIds`-V, --version`, OptionPriority.HIGH);

	export const replace = new OptionDefinition(optIds`-R, --replace`);

	export const style =
		new OptionDefinition(
			optIds`-S, --style`,
			new OptionArgumentDefinition("style", new StringEnumDataType("compact", "tabs", "spaces:4")),
		);
}

export const cliUsage = new CommandsUsage(
	[
		OptionDefinitions.help,
		OptionDefinitions.versionInfo,
	],
	{
		"download": new RegularUsage(
			[
				OptionDefinitions.help,
				OptionDefinitions.replace,
			],
			[
				new OperandDefinition("playlist_file", StringDataType.rejectEmpty),
			],
		),
		"sort": new RegularUsage(
			[
				OptionDefinitions.help,
				OptionDefinitions.style,
			],
			[
				new OperandDefinition("playlist_file", StringDataType.rejectEmpty),
			],
		),
	},
);

/*
function checkSpecifiedOption(specifiedOption: SpecifiedOption): ("missingOperand" | "excessiveOperand" | undefined) {
	const optionArgSpec: OptionArgSpec = specifiedOption.getDefinition().getArgSpec();
	const argSpecified: boolean = ((typeof specifiedOption.getArgument()) === "string");

	if (!(optionArgSpec.hasArg()) && argSpecified) {
		return "excessiveOperand";
	}

	if (optionArgSpec.isArgRequired() && !argSpecified) {
		return "missingOperand";
	}

	return undefined;
}

function specifiedOptionToCLIParsingResult(specifiedOption: SpecifiedOption, commandName?: string): ({
	readonly type: "missingOperand(s)";
	readonly commandName?: string;
	readonly specifiedOption?: SpecifiedOption;
	readonly operandNames: readonly [string, ...string[]];
} | {
	readonly type: "excessiveOperand(s)";
	readonly commandName?: string;
	readonly specifiedOption?: SpecifiedOption;
	readonly count: number;
} | undefined) {
	const result = checkSpecifiedOption(specifiedOption);

	switch (result) {
		case "missingOperand": {
			return {
				type: "missingOperand(s)",
				commandName,
				specifiedOption: specifiedOption,
				operandNames: [specifiedOption.getDefinition().getArgSpec().getArgName()],
			};
		}

		case "excessiveOperand": {
			return {
				type: "excessiveOperand(s)",
				commandName,
				specifiedOption: specifiedOption,
				count: 1,
			};
		}

		case undefined: {
			return undefined;
		}

		default: {
			throw new InternalException();
		}
	}
}

export namespace CLI {
	export function parse(args: readonly string[]): CLIParsingResult {
		const argsParsingResult: CommandsArgsParsingResult = parseArgs(usage, args);

		//#region pre-command options

		const specifiedPreCommandOptions: readonly SpecifiedOption[] =
			argsParsingResult.getSpecifiedPreCommandOptions();

		//#region high priority options

		const firstSpecifiedPreCommandHighPriorityOption: (SpecifiedOption | undefined) = specifiedPreCommandOptions
			.find((specifiedOption: SpecifiedOption): boolean => {
				return OptionDefinitions.isHighPriority(specifiedOption.getDefinition());
			});

		if (firstSpecifiedPreCommandHighPriorityOption instanceof SpecifiedOption) {
			const result = specifiedOptionToCLIParsingResult(firstSpecifiedPreCommandHighPriorityOption);

			if (typeof result === "object") {
				return result;
			}

			switch (firstSpecifiedPreCommandHighPriorityOption.getDefinition()) {
				case OptionDefinitions.help: {
					return {
						type: "success",
						cli: {
							execMode: "showHelp",
						},
					};
				}
				case OptionDefinitions.versionInfo: {
					return {
						type: "success",
						cli: {
							execMode: "showVersionInfo",
						},
					};
				}
				case undefined: {
					break;
				}
				default: {
					throw new InternalException();
				}
			}
		}

		//#endregion

		//#region normal priority options

		const firstInvalidPreCommandOptionIdentifier: (OptionIdentifier | undefined) =
			argsParsingResult.getFirstInvalidPreCommandOptionIdentifier();

		if (firstInvalidPreCommandOptionIdentifier instanceof OptionIdentifier) {
			return {
				type: "invalidOption",
				invalidOptionIdentifier: firstInvalidPreCommandOptionIdentifier,
			};
		}


		for (const specifiedOption of specifiedPreCommandOptions) {
			const result = specifiedOptionToCLIParsingResult(specifiedOption);

			if (typeof result === "object") {
				return result;
			}
		}

		//#endregion

		//#endregion

		//#region command

		if (!(argsParsingResult.isCommandSpecified())) {
			return {
				type: "missingOperand(s)",
				operandNames: ["command"],
			};
		}

		const commandName: string = argsParsingResult.getCommandName();
		const commandArgsParsingResult: (ArgsParsingResult | undefined) =
			argsParsingResult.getCommandArgsParsingResult();

		if (commandName.length === 0) {
			let n: (number | undefined) = undefined;

			if (argsParsingResult.getTotalOperandsCount() > 1) {
				n = 1;
			}

			return { type: "emptyOperand", n };
		}

		if (typeof commandArgsParsingResult !== "object") {
			return { type: "unknownCommand", commandName };
		}

		switch (commandName) {
			case "download": {
				if (!(commandArgsParsingResult instanceof RegularArgsParsingResult)) {
					throw new InternalException();
				}

				const playlistFileOperand: (string | undefined) =
					commandArgsParsingResult.getOperands()["playlist_file"];

				if (typeof playlistFileOperand !== "string") {
					return {
						type: "missingOperand(s)",
						commandName,
						operandNames: ["playlist_file"],
					};
				}

				if (playlistFileOperand.length === 0) {
					let n: (number | undefined) = undefined;

					if (commandArgsParsingResult.getTotalOperandsCount() > 1) {
						n = 1;
					}

					return {
						type: "emptyOperand",
						commandName,
						n
					};
				}

				const excessOperandCount: number = commandArgsParsingResult.getExcessOperandCount();
				if (excessOperandCount > 0) {
					return {
						type: "excessiveOperand(s)",
						commandName,
						count: excessOperandCount,
					};
				}

				const specifiedOptions: readonly SpecifiedOption[] = commandArgsParsingResult.getSpecifiedOptions();

				const firstSpecifiedHighPriorityOption: (SpecifiedOption | undefined) = specifiedOptions
					.find((specifiedOption: SpecifiedOption): boolean => {
						return OptionDefinitions.isHighPriority(specifiedOption.getDefinition());
					});

				if (firstSpecifiedHighPriorityOption instanceof SpecifiedOption) {
					const result = specifiedOptionToCLIParsingResult(firstSpecifiedHighPriorityOption);

					if (typeof result === "object") {
						return result;
					}

					switch (firstSpecifiedHighPriorityOption.getDefinition()) {
						case OptionDefinitions.help: {
							return {
								type: "success",
								cli: {
									execMode: "showHelp",
									commandName,
								},
							};
						}
						case undefined: {
							break;
						}
						default: {
							throw new InternalException();
						}
					}
				}

				const firstInvalidOptionIdentifier: (OptionIdentifier | undefined) =
					commandArgsParsingResult.getFirstInvalidOptionIdentifier();

				if (firstInvalidOptionIdentifier instanceof OptionIdentifier) {
					return {
						type: "invalidOption",
						invalidOptionIdentifier: firstInvalidOptionIdentifier,
					};
				}


				for (const specifiedOption of specifiedOptions) {
					const result = specifiedOptionToCLIParsingResult(specifiedOption);

					if (typeof result === "object") {
						return result;
					}
				}

				return {
					type: "success",
					cli: {
						execMode: "download",
						playlistFilePathname: playlistFileOperand,
					},
				};
			}
			case "sort": {
				break;
			}
			default: {
				throw new InternalException();
			}
		}

		//#endregion
	}

	export function parseProcessArgs(): CLIParsingResult {
		return parse(process.argv.slice(2));
	}
}
*/
