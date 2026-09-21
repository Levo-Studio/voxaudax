import type { CoverColorId } from "@/lib/cover";

export type TipTapMark = {
  readonly type: string;
  readonly attrs?: Readonly<Record<string, unknown>>;
};

export type TipTapNode = {
  readonly type: string;
  readonly attrs?: Readonly<Record<string, unknown>>;
  readonly marks?: readonly TipTapMark[];
  readonly content?: readonly TipTapNode[];
  readonly text?: string;
};

export type TipTapDocument = {
  readonly type: "doc";
  readonly content: readonly TipTapNode[];
};

/**
 * What the editor's Cover tab writes. `word` and `line` are the two lines of
 * type set over `colorId`; `imageId` replaces the whole generated cover with a
 * photograph, and the alt text that then becomes mandatory lives on the image.
 */
export type ArticleCover = {
  readonly word: string;
  readonly line: string;
  readonly colorId: CoverColorId;
  readonly imageId?: string;
};
