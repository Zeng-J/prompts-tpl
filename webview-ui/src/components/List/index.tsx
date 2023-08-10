import { useState, memo } from "react";
import { VSCodeButton, VSCodeLink } from "@vscode/webview-ui-toolkit/react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import type { OnDragEndResponder } from "react-beautiful-dnd";
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
              <VSCodeLink
                onClick={() => {
                  changeRoute({
                    type: Type.update,
                    id: data.id,
                  });
                }}
              >
                编辑
              </VSCodeLink>
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
    return <div className={s.list_empty}>您暂无模板，请创建一个吧～</div>
  }

  return dataSource.map((item, index: number) => (
    <ListItem changeRoute={changeRoute} data={item} index={index} key={item.id} />
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

  return (
    <div className={s.container}>
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
    </div>
  );
}
