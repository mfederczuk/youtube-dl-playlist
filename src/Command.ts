/*
 * Copyright (c) 2023 Michael Federczuk
 * SPDX-License-Identifier: MPL-2.0 AND Apache-2.0
 */

import { InternalException } from "@mfederczuk/custom-exception";
import { UByte } from "./utils/UByte";

export type ExitCode = UByte;
export type OptionalExitCode = (ExitCode | void);

export abstract class Command {

	protected abstract doInvoke(...args: string[]): (Promise<OptionalExitCode> | OptionalExitCode);

	async invoke(...args: string[]): Promise<ExitCode> {
		let ret: (Promise<OptionalExitCode> | OptionalExitCode) = this.doInvoke(...args);

		if (ret instanceof Promise) {
			ret = await ret;
		}

		if (typeof ret === "undefined") {
			ret = 0;
		}

		if (typeof ret !== "number") {
			throw new InternalException("doInvoke() must return either `undefined` or a number");
		}

		if (!(UByte.isUByte(ret))) {
			throw new InternalException("Numbers returned from doInvoke() must be an integer from 0 to 255");
		}

		return ret;
	}
}
