import { CATEGORY, TYPE } from "../utils/enum";

export type NewsType = {
  id: string;
  category: CATEGORY | string; // Allow both enum and string for backend compatibility
  type: TYPE | string; // Allow both enum and string for backend compatibility
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
  viewCount?: number; // Add viewCount from backend API
};