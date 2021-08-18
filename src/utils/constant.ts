import { CommentType } from "../types/CommentType"
import { NewsType } from "../types/NewsType"
import { CATEGORY, TYPE } from "./enum"

export const MIN_SLUG_LENGTH = 8
export const TIMEOUT = 200
export const UPLOAD_FILE_PATH =
  "https://us-central1-news-26417.cloudfunctions.net/uploadFile"
export const DEFAULT_NEWS: NewsType = {
  type: TYPE.NEWS,
  category: CATEGORY.TRABZONSPOR,
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
  category: CATEGORY.TRABZONSPOR,
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
  FOOTBALL: { key: CATEGORY.FOOTBALL, value: "Futbol", to: "futbol" },
  TRANSFER: { key: CATEGORY.TRANSFER, value: "Transfer", to: "transfer" },
  GENERAL: { key: CATEGORY.GENERAL, value: "Trabzon Gündemi", to: "gundem" }
})

export const BreakingNewsImgPath = "https://firebasestorage.googleapis.com/v0/b/news-26417.appspot.com/o/tskulis-EQp1k2OW4AALwQt.jfif.webp?alt=media&token=db4a1bab-06a6-48c0-9743-3046d16fc7a4"

export const COMMENT_ONE_EMNIYET: CommentType = {
  text: "Güzel bir haber olmuş",
  isActive: true,
  createDate: "2021-06-23T10:21:32.786Z",
  updateDate: "2021-06-23T10:21:32.786Z",
  id: "1",
  newsId: "726ce751-40c4-44fb-a998-77369333ad28",
  userName: "mehmet@gmail.com"
}

export const COMMENT_TWO_EMNIYET: CommentType = {
  text: "Katılıyorum",
  isActive: true,
  createDate: "2021-06-24T10:21:32.786Z",
  updateDate: "2021-06-24T10:21:32.786Z",
  id: "1",
  newsId: "726ce751-40c4-44fb-a998-77369333ad28",
  userName: "ayse@gmail.com"
}