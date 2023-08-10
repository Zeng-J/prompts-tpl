import { useState, useEffect, useRef, memo } from "react";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import type { OnDragEndResponder } from "react-beautiful-dnd";
import CopyOutlined from "../../icons/CopyOutlined";
import EditOutlined from "../../icons/EditOutlined";
import CheckOutlined from "../../icons/CheckOutlined";
import { Type } from "../../enums";
import { IChangeState, ITemplateItem } from "../../types";
import { vscode } from "../../utils/vscode";
import s from "./index.module.css";

const reorder = (
  list: ITemplateItem[],
  startIndex: number,
  endIndex: number
) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

function ListItem({
  data,
  index,
  changeRoute,
}: {
  data: ITemplateItem;
  index: number;
  changeRoute: IChangeState;
}) {
  const [isCopied, setIsCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isCopied) {
      timerRef.current = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [isCopied]);
  return (
    <Draggable draggableId={data.id} index={index}>
      {(provided) => {
        return (
          <div
            className={s.list_item}
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            <div className={s.list_item_header}>
              <div className={s.list_item_title}>{data.title}</div>
              <VSCodeButton
                onClick={() => {
                  if (!isCopied) {
                    vscode.postMessage({ type: "copy", data: data.content });
                    setIsCopied(true);
                  }
                }}
                appearance="icon"
                aria-label="copy"
                disabled={isCopied}
              >
                <CopyOutlined
                  style={{ display: isCopied ? "none" : "inline-block" }}
                />
                <CheckOutlined
                  style={{
                    display: isCopied ? "inline-block" : "none",
                    color: "#0969da",
                  }}
                />
              </VSCodeButton>
              <VSCodeButton
                onClick={() => {
                  changeRoute({
                    type: Type.update,
                    id: data.id,
                  });
                }}
                appearance="icon"
                aria-label="edit"
              >
                <EditOutlined />
              </VSCodeButton>
            </div>
            <div className={s.list_item_content}>{data.content}</div>
          </div>
        );
      }}
    </Draggable>
  );
}

const ListCom = memo(function ListComp({
  dataSource,
  changeRoute,
}: {
  dataSource: ITemplateItem[];
  changeRoute: IChangeState;
}) {
  if (dataSource.length <= 0) {
    return <div className={s.list_empty}>您暂无模板，请创建一个吧～</div>;
  }

  return dataSource.map((item, index: number) => (
    <ListItem
      changeRoute={changeRoute}
      data={item}
      index={index}
      key={item.id}
    />
  ));
});

interface ListProps {
  changeRoute: IChangeState;
}

export default function List({ changeRoute }: ListProps) {
  const [list, setList] = useState<ITemplateItem[]>(() => {
    const templates = vscode.getState()?.templates || [];
    return templates;
  });

  const onDragEnd: OnDragEndResponder = (result) => {
    if (!result.destination) {
      return;
    }

    if (result.destination.index === result.source.index) {
      return;
    }

    const newList = reorder(
      list,
      result.source.index,
      result.destination.index
    );
    vscode.setStateAndSendMessage({ templates: newList }, { type: "save" });
    setList(newList);
  };

  useEffect(() => {
    // vscode不同项目的webview的数据时不共享的，所以要获取插件globalState数据同步一下
    vscode.postMessage({ type: "init" });
    const onMessage = (event: WindowEventMap["message"]) => {
      const message = event.data;
      if (message.type === "init") {
        setList(message.data);
        vscode.setState({ templates: message.data });
      }
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);

  return (
    <div className={s.wrapper}>
      <main className={s.container}>
        <h1 className={s.title}>模板列表</h1>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="list">
            {(provided) => (
              <div
                className={s.list}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <ListCom dataSource={list} changeRoute={changeRoute} />
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <VSCodeButton onClick={() => changeRoute({ type: Type.add })}>
          新增模板
        </VSCodeButton>
        <VSCodeButton
          style={{ marginLeft: 12 }}
          onClick={() => vscode.postMessage({ type: "export" })}
        >
          导出数据
        </VSCodeButton>
      </main>
      <footer className={s.footer}>
        <p className={s.help}>
          vscode不同项目下的该页面数据是不同步的，如果其他项目编辑了模板，当前项目页面没有显示最新数据时，请点击下方按钮同步（当然也可以关闭项目，下次进来就是最新的）。
        </p>
        <VSCodeButton
          onClick={() => {
            vscode.postMessage({ type: "init" });
          }}
        >
          同步数据
        </VSCodeButton>
      </footer>
    </div>
  );
}
