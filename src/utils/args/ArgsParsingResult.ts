/*
 * Copyright (c) 2023 Michael Federczuk
 * SPDX-License-Identifier: MPL-2.0 AND Apache-2.0
 */

import { DataT } from "./DataType";
import { OperandDefinition } from "./OperandDefinition";
import { OperandInstance } from "./OperandInstance";
import { OptionArgumentDefinition, OptionDefinition } from "./OptionDefinition";
import { OptionIdentifier } from "./OptionIdentifier";
import { OptionInstance } from "./OptionInstance";
import { CommandsUsage, RegularUsage, Usage } from "./Usage";

export namespace ArgsParsingResult {
	type BaseArgsParsingResult = {
		readonly commandNamePath: readonly string[];
	};

	export namespace Success {
		export namespace Regular {
			export type Normal = BaseArgsParsingResult & {
				readonly type: "success/regular/normal";

				readonly sourceUsage: RegularUsage;

				readonly options: ReadonlySet<OptionInstance<DataT | void>>;
				readonly operands: readonly OperandInstance<DataT>[];
			};

			export type HighPriorityOption = BaseArgsParsingResult & {
				readonly type: "success/regular/highPriorityOption";

				readonly sourceUsage: RegularUsage;

				readonly highPriorityOption: OptionInstance<DataT | void>;
			};
		}

		export type Regular = (Regular.Normal | Regular.HighPriorityOption);


		export namespace Commands {
			export type Normal = BaseArgsParsingResult & {
				readonly type: "success/commands/normal";

				readonly sourceUsage: CommandsUsage;

				readonly preCommandOptions: ReadonlySet<OptionInstance<DataT | void>>;
				readonly command: {
					readonly name: string;
					readonly argsResult: ArgsParsingResult.Success;
				};
			};

			export type HighPriorityOption = BaseArgsParsingResult & {
				readonly type: "success/commands/highPriorityOption";

				readonly sourceUsage: CommandsUsage;

				readonly highPriorityOption: OptionInstance;
			};
		}

		export type Commands = (Commands.Normal | Commands.HighPriorityOption);
	}

	export type Success = (Success.Regular | Success.Commands);


	export namespace Failure {
		export type MissingArguments = BaseArgsParsingResult & {
			readonly type: "failure/missingArgument(s)";

			readonly sourceUsage: Usage;
		} & ({
			readonly optionDefinition?: undefined;
			readonly missingArgumentDefinitions: readonly [OperandDefinition<DataT>, ...OperandDefinition<DataT>[]];
		} | {
			readonly optionDefinition: OptionDefinition<DataT | void>;
			readonly missingArgumentDefinitions: readonly [OptionArgumentDefinition<DataT>];
		});

		export type ExcessiveArguments = BaseArgsParsingResult & {
			readonly type: "failure/excessiveArgument(s)";

			readonly sourceUsage: Usage;

			readonly optionDefinition?: OptionDefinition<DataT | void>;
			readonly count: number;
		};

		export type InvalidOption = BaseArgsParsingResult & {
			readonly type: "failure/invalidOption";

			readonly sourceUsage: Usage;

			readonly invalidOptionIdentifier: OptionIdentifier;
		};

		export type InvalidEnumValue = BaseArgsParsingResult & {
			readonly type: "failure/invalidEnumValue";

			readonly sourceUsage: Usage;

			readonly optionDefinition?: OptionDefinition<DataT | void>;
			readonly enumValues: readonly [string, ...string[]];
			readonly actualValue: string;
		};

		export type UnknownCommand = BaseArgsParsingResult & {
			readonly type: "failure/unknownCommand";

			readonly sourceUsage: CommandsUsage;

			readonly commandName: string;
		};

		export type EmptyArgument = BaseArgsParsingResult & {
			readonly type: "failure/emptyArgument";

			readonly sourceUsage: Usage;

			readonly optionDefinition?: OptionDefinition<DataT | void>;
			readonly operandNr?: number;
		};
	}

	export type Failure = (Failure.MissingArguments   |
	                       Failure.ExcessiveArguments |
	                       Failure.InvalidOption      |
	                       Failure.InvalidEnumValue   |
	                       Failure.UnknownCommand     |
	                       Failure.EmptyArgument);
}

export type ArgsParsingRegularResult  = (ArgsParsingResult.Success.Regular  | ArgsParsingResult.Failure);
export type ArgsParsingCommandsResult = (ArgsParsingResult.Success.Commands | ArgsParsingResult.Failure);
export type ArgsParsingResult         = (ArgsParsingResult.Success          | ArgsParsingResult.Failure);
