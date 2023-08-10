import * as vscode from "vscode";
import * as fs from "fs";
import TemplatesViewProvider from "./TemplatesViewProvider";

// // 要保存的数据
// const data = {
//   name: "promptsTpl",
//   templates: [
//     { label: "Item 1", description: "This is item 1" },
//     { label: "Item 2", description: "This is item 2" },
//     { label: "Item 3", description: "This is item 3" },
//   ],
// };

// // 将数据转换为 JSON 字符串
// const dataStr = JSON.stringify(data);

// // 将数据写入文件
// fs.writeFileSync(`${__dirname}/data.json`, dataStr);

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "promptstpl" is now active!');

  // const dynamicMenuCommand = "my-extension.dynamicMenu";

  // context.subscriptions.push(
  //   vscode.commands.registerCommand(dynamicMenuCommand, async () => {
  //     // 从文件中读取数据
  //     const dataStr = fs.readFileSync(`${__dirname}/data.json`, "utf-8");
  //     // 将 JSON 字符串转换为对象
  //     const data = JSON.parse(dataStr);
  //     const items: vscode.QuickPickItem[] = data.templates;
  //     const selected = await vscode.window.showQuickPick(items);
  //     if (selected) {
  //       // 获取当前活动的文本编辑器
  //       const editor = vscode.window.activeTextEditor;

  //       if (editor) {
  //         // 获取用户选择的文本
  //         const selection = editor.selection;
  //         const selectedText = editor.document.getText(selection);

  //         // 打印用户选择的文本
  //         console.log(selectedText);
  //       }
  //       vscode.window.showInformationMessage(`You selected ${selected.label}`);
  //     }
  //   })
  // );

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
