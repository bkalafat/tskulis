import { NewsType } from "../types/NewsType"
import { CATEGORY, TYPE } from "./enum"

export const MIN_SLUG_LENGTH = 8
export const UPLOAD_FILE_PATH =
  "https://us-central1-news-26417.cloudfunctions.net/uploadFile"
export const DEFAULT_NEWS: NewsType = {
  type: TYPE.NEWS,
  category: CATEGORY.GENERAL,
  caption: "",
  summary: "",
  content:
    "<h2>(Başlık)</h2<p></p><p></p><p>İçerik oluştur...</p><p>(Kopyala yapıştır ile direk sayfa alabilirsin)</p><p></p><p></p>",
  isActive: true,
  priority: 300,
  imgPath: "https://via.placeholder.com/500x250?text=HABER",
  imgAlt: "haber",
  slug: "",
  url: "",
  authors: [""],
  createDate: "",
  updateDate: "",
  expressDate: "",
  id: null,
  isSecondPageNews: false,
  subjects: [""],
  keywords: "",
  socialTags: "",
}

export const TEST_NEWS: NewsType = {
  type: TYPE.NEWS,
  category: CATEGORY.GENERAL,
  caption: "Test Caption About " + Date.now.toString(),
  summary: "Test Summary About " + Date.now.toString(),
  content:
    "<h2>(Başlık)</h2<p></p><p></p><p>İçerik oluştur...</p><p>(Kopyala yapıştır ile direk sayfa alabilirsin)</p><p></p><p></p>",
  isActive: true,
  priority: 300,
  imgPath: "https://via.placeholder.com/1000x500?text=Test_HABER" + Date.now.toString(),
  imgAlt: "Test Caption About " + Date.now.toString(),
  slug: "",
  url: "",
  authors: [""],
  createDate: "",
  updateDate: "",
  expressDate: "",
  id: null,
  isSecondPageNews: false,
  subjects: [""],
  keywords: "",
  socialTags: "",
}

export const Categories = Object.freeze({
  TRABZONSPOR: { key: CATEGORY.TRABZONSPOR, value: "Trabzonspor", to: "trabzonspor" },
  ECONOMY: { key: CATEGORY.TRANSFER, value: "Transfer", to: "transfer" },
  SPORT: { key: CATEGORY.GENERAL, value: "Trabzon Gündemi", to: "gundem" }
})
