import * as vscode from "vscode";
import * as fs from "fs";
import { getNonce } from "./utils";

export default class TemplatesViewProvider
  implements vscode.WebviewViewProvider
{
  public static readonly viewType = "promptsTplView";

  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _extensionContext: vscode.ExtensionContext
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, "webview-ui/dist"),
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case "save": {
          this._extensionContext.globalState.update(
            "templates",
            data.data.templates
          );
          break;
        }
        case "export": {
          this.exportJson();
          break;
        }
        case "copy": {
          this.copyText(data.data);
          break;
        }
        case "init": {
          this._sendTemplates();
          break;
        }
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "webview-ui",
        "dist",
        "assets",
        "index.js"
      )
    );
    const stylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "webview-ui",
        "dist",
        "assets",
        "index.css"
      )
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Hello World</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }

  private _sendTemplates() {
    const templates = this.getTemplates();
    this._view?.webview.postMessage({
      type: "init",
      data: templates,
    });
  }

  getTemplates() {
    const templates = (this._extensionContext.globalState.get("templates") ||
      []) as { id: string; title: string; content: string }[];
    return templates;
  }

  async selectTemplate() {
    const templates = this.getTemplates();
    const items: vscode.QuickPickItem[] = templates.map((item) => ({
      label: item.title,
      description: item.content,
    }));
    const selected = await vscode.window.showQuickPick(items);
    if (selected) {
      // 获取当前活动的文本编辑器
      const editor = vscode.window.activeTextEditor;
      let selectedText = "";
      if (editor) {
        // 获取用户选择的文本
        const selection = editor.selection;
        selectedText = editor.document.getText(selection);
      }
      const result =
        selected.description?.replace(/\$selection\$/g, selectedText) || "";

      try {
        await vscode.env.clipboard.writeText(result);
      } catch (_) {
        vscode.window.showInformationMessage("粘贴失败");
      }
    }
  }

  exportJson() {
    const templates = this.getTemplates();
    const json = JSON.stringify(templates, null, 2);
    vscode.window
      .showSaveDialog({
        defaultUri: vscode.Uri.file("promptstpl.json"),
        filters: { json: ["json"] },
      })
      .then((uri) => {
        if (uri) {
          fs.writeFile(uri.fsPath, json, (err) => {
            if (err) {
              vscode.window.showErrorMessage(
                `Failed to export data: ${err.message}`
              );
            } else {
              vscode.window.showInformationMessage(
                `Data exported to ${uri.fsPath}`
              );
            }
          });
        }
      });
  }

  async copyText(txt: string) {
    try {
      await vscode.env.clipboard.writeText(txt);
    } catch (_) {
      vscode.window.showInformationMessage("粘贴失败");
    }
  }
}
