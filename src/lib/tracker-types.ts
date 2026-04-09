export interface Feature {
  id: number;
  gid: number;
  macro: string;
  micro: string;
  label: string;
  note: string;
  tags: string[];
  mirrorGid?: number;
}

export interface Group {
  id: string;
  name: string;
  features: Feature[];
}

export interface Sub {
  id: string;
  name: string;
  groups: Group[];
}

export interface Tag {
  id: string;
  label: string;
  color: string;
}

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderStrong: string;
  text: string;
  textSub: string;
  textMuted: string;
  noteBg: string;
  noteBorder: string;
  noteText: string;
  shadow: string;
  shadowMd: string;
}

export interface AxisColors {
  accent: string;
  accentLight: string;
  accentText: string;
  subGradient: string;
  subText: string;
  subCountBg: string;
  subCountText: string;
  groupGradient: string;
  groupBorder: string;
  groupText: string;
}

export type MacroStatus = "none" | "outdated" | "kill" | "horsmvp";
export type MicroStatus = "none" | "new" | "doing" | "done";

export interface ReducerAction {
  type: string;
  subId?: string;
  gId?: string;
  fId?: number;
  field?: string;
  val?: any;
  label?: string;
  note?: string;
  name?: string;
  tagId?: string;
  tFId?: number;
  tGId?: string;
  tSId?: string;
  drag?: any;
  newGid?: number;
  mirrorGid?: number;
  feat?: Feature;
}
