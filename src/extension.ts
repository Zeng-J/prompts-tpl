import * as vscode from "vscode";
import TemplatesViewProvider from "./TemplatesViewProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "promptstpl" is now active!');

  const provider = new TemplatesViewProvider(context.extensionUri, context);

  context.subscriptions.push(
    vscode.commands.registerCommand("extension.promptsTpl", async () => {
      provider.selectTemplate();
    })
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      TemplatesViewProvider.viewType,
      provider
    )
  );
}

export function deactivate() {}
