import * as Const from "./constant"
import slugify from "slugify"
import { NewsType } from "../types/NewsType"

export function getEnvironmentUrl() {
  return process.env.NEXT_PUBLIC_API_PATH
}

export const convertFile = async (uri: any, filename: string) => {
  const response = await fetch(uri)
  const arrayBuffer = await response.arrayBuffer()
  return new File([arrayBuffer], filename, { type: "WEBP" })
}

export function setDefaultValues(news: NewsType) {
  news.subjects = ["haber"]
  news.createDate = new Date().toISOString()
  news.updateDate = new Date().toISOString()
  news.expressDate = new Date().toISOString()
  news.slug = slugify(news.caption)
  news.url = generateUrlWithoutId(news)
  news.priority = 300
  news.imgAlt = news.caption;
  delete news['id']

  return news
}

export const getCategoryByTo = (to: string) => {
  return Object.values(Const.Categories).find(c => c.to === to)
}

export const getCategoryToByKey = (key: string) => {
  const categories = Object.values(Const.Categories)
  const category = categories.find(c => c.key === key)
  return category ? category.to : "new"
}

export const getUrlWithId = (news: NewsType) => {
  return "https://tskulis.com/" + getCategoryToByKey(news.category) + "/" + getSlug(news) + "/" + news.id
}

export const getFullUrl = (news: NewsType) => {
  return news.url.length >= Const.MIN_SLUG_LENGTH ? news.url : getUrlWithId(news)
}

export const getHrefModel = (urlLength: number) => {
  return urlLength < Const.MIN_SLUG_LENGTH ? "[category]/[slug]/[id]" : "[category]/[slug]";
}

export const getSlug = (news: NewsType) => {
  return news.slug?.length > Const.MIN_SLUG_LENGTH ? news.slug : slugify(news.caption);
}

export const getFullSlug = (news: NewsType) => {
  return news.slug?.length > Const.MIN_SLUG_LENGTH ? getCategoryToByKey(news.category) + "/" + getSlug(news) : getCategoryToByKey(news.category) + "/" + getSlug(news) + "/" + news.id
}

export const generateUrlWithoutId = (news: NewsType) => {
  return "https://tskulis.com/" + getCategoryToByKey(news.category) + "/" + getSlug(news)
}

export const sortCreateDateDesc = () => {
  return function (a: NewsType, b: NewsType) {
    return new Date(b.createDate).getTime() - new Date(a.createDate).getTime()
  }
}

export const getAdmins = () => {
  return ["kalafatburak@gmail.com","fatalarr@gmail.com","ktuna17@outlook.com", "mircolakoglu@gmail.com", "burakkalafat@hotmail.com", "barisatmaca061@gmail.com"];
}

export const ShowMedias = (content: string) => {
  if (typeof window !== 'undefined') {
    const parentEmbed = document.createElement("span")
    parentEmbed.innerHTML = content
    const something = parentEmbed;

    let oembeds = something.querySelectorAll("oembed")
    let embedArray = Array.from(oembeds)

    for (const embed in embedArray) {
      let url = embedArray[embed].getAttribute("url")
      url = url.replace("watch?v=", "embed/")
      const newIframe = document.createElement("iframe")
      newIframe.setAttribute("width", "auto")
      newIframe.setAttribute("height", "auto")
      newIframe.setAttribute("allowFullScreen", "")
      newIframe.setAttribute("frameBorder", "0")
      if (url) {
        newIframe.setAttribute("src", url)
      }

      embedArray[embed].parentNode.replaceChild(newIframe, embedArray[embed])
    }

    return parentEmbed.outerHTML
  }

  return content;
}
