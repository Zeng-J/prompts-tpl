import * as vscode from "vscode";
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

      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, "webview-ui/dist")],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      console.log(data);
      switch (data.type) {
        case "save": {
          this._extensionContext.globalState.update(
            "templates",
            data.data.templates
          );
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

  async selectTemplate() {
    const templates = (this._extensionContext.globalState.get("templates") ||
      []) as { title: string; content: string }[];
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

        // 打印用户选择的文本
        console.log(selectedText);
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
}
