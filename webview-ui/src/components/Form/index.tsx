import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import {
  VSCodeButton,
  VSCodeTextArea,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { v4 as uuidv4 } from "uuid";
import { Type } from "../../enums";
import { IChangeState } from "../../types";
import { vscode } from "../../utils/vscode";
import s from "./index.module.css";

interface IForm {
  title: string;
  content: string;
}

interface FormProps {
  id?: string;
  changeRoute: IChangeState;
}

function Form({ id, changeRoute }: FormProps) {
  const {
    register,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<IForm>({
    defaultValues: async () => {
      const templates = vscode.getState()?.templates || [];
      let curItem;
      if (id) {
        curItem = templates.find((item) => item.id === id);
      }
      return (
        curItem || {
          title: "",
          content: "",
        }
      );
    },
  });

  const handleSave = (formData: IForm) => {
    const state = vscode.getState();
    const list = state?.templates || [];
    let curItem;
    if (id) {
      curItem = list.find((item) => item.id === id);
    }

    if (curItem) {
      curItem.title = formData.title;
      curItem.content = formData.content;
    } else {
      list.push({
        ...formData,
        id: uuidv4(),
      });
    }
    vscode.setStateAndSendMessage({ templates: list }, { type: "save" });
    changeRoute({
      type: Type.list,
    });
  };

  const handleSubmit = () => {
    trigger().then((success) => {
      if (success) {
        handleSave(getValues());
      }
    });
  };

  const handleDelete = () => {
    Swal.fire({
      title: "确认删除?",
      text: "你将不能恢复该模板!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "确认",
      cancelButtonText: "取消",
    }).then((result) => {
      if (result.isConfirmed) {
        const templates = vscode.getState()?.templates || [];
        const index = templates.findIndex((item) => item.id === id);
        templates.splice(index, 1);
        vscode.setStateAndSendMessage({ templates }, { type: "save" });
        changeRoute({
          type: Type.list,
        });
      }
    });
  };

  return (
    <div className={s.container}>
      <h1 className={s.title}>编辑表单</h1>
      <form>
        <section className={s.form_item}>
          <div className={s.form_item_label}>模板标题</div>
          <VSCodeTextField
            className={s.input}
            placeholder="请输入模板标题"
            {...register("title", { required: true })}
          />
          {errors.title && <div className={s.form_item_error}>必须填写</div>}
        </section>
        <section className={s.form_item}>
          <div className={s.form_item_label}>模板内容</div>
          <VSCodeTextArea
            className={s.input}
            placeholder={`请输入模板内容，例如:
请给下面的代码进行解释
\`\`\`
$selection$
\`\`\``}
            rows={8}
            resize="vertical"
            {...register("content", { required: true })}
          />
          {errors.content && <div className={s.form_item_error}>必须填写</div>}
          <p className={s.form_item_help}>
            如有需要选中内容的占位符请使用：
            <span className={s.form_item_tag}>$selection$</span>。到时会自动替换
          </p>
        </section>
        <div>
          <VSCodeButton className={s.btn} type="button" onClick={handleSubmit}>
            保存
          </VSCodeButton>
          {id ? (
            <VSCodeButton
              className={s.btn}
              type="button"
              appearance="secondary"
              onClick={handleDelete}
            >
              删除
            </VSCodeButton>
          ) : (
            false
          )}
          <VSCodeButton
            className={s.btn}
            type="button"
            onClick={() => {
              changeRoute({
                type: Type.list,
              });
            }}
          >
            返回
          </VSCodeButton>
        </div>
      </form>
    </div>
  );
}

export default Form;
