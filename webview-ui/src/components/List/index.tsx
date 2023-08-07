import { useState } from "react";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

const data = [
  {
    key: "1",
  },
  {
    key: "1",
  },
  {
    key: "1",
  },
];

function List() {
  return (
    <div>
      <h1>模板列表</h1>
      <ul>
        {data.map((item, index) => (
          <li key={index}>aawdwa</li>
        ))}
      </ul>
      <VSCodeButton>新增</VSCodeButton>
    </div>
  );
}

export default List;
