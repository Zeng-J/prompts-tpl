import { Type } from "../enums";

export type IRoute =
  | {
      type: Type.update;
      id: string;
    }
  | {
      type: Type.list | Type.add;
      id?: undefined;
    };

export type IChangeState = (v: IRoute) => void;

export interface ITemplateItem {
  id: string;
  title: string;
  content: string;
}
