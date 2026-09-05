import { vi, expect, type Mock } from 'vitest';
import { registerCommand } from './__mocks__/vscode';
import type { ExtensionContext } from 'vscode';
import { context } from './__mocks__/shared';

/** Expect all commands to be registered */
export function expectCommandsRegistered(
	commandRegisterFun: (context: ExtensionContext, ...args: any[]) => void,
	commandsArray: string[]
) {
	vi.spyOn(context.subscriptions, 'push');
	commandRegisterFun(context);

	expect(context.subscriptions.push).toHaveBeenCalledTimes(1);
	expect(registerCommand).toHaveBeenCalledTimes(commandsArray.length);

	const registeredCommands = (registerCommand as Mock).mock.calls.map((call) => call[0]);
	expect(registeredCommands).toEqual(expect.arrayContaining(commandsArray));
}
