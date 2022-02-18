import { CATEGORY, TYPE } from "../utils/enum";

export type NewsType = {
  id: string;
  category: CATEGORY;
  type: TYPE;
  caption: string;
  summary: string;
  imgPath: string;
  imgAlt: string;
  content: string;
  subjects: string[];
  authors: string[];
  createDate: string;
  updateDate: string;
  expressDate: string;
  priority: number;
  isActive: boolean;
  isSecondPageNews: boolean;
  showNotification: boolean;
  slug: string;
  url: string;
  keywords: string;
  socialTags: string;
};