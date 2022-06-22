import * as Const from "./constant"
import slugify from "slugify"
import { NewsType } from "../types/NewsType"
import { CommentType } from "../types/CommentType"
import { getNewsBySlug } from "./api"

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
  news.slug = slugifyMarkless(news.caption)
  news.url = generateUrlWithoutId(news)
  news.priority = 300
  news.imgAlt = news.caption;
  delete news['id']

  return news
}

export function setDefaultCommentValues(comment: CommentType) {
  comment.createDate = new Date().toISOString()
  comment.updateDate = new Date().toISOString()
  delete comment['id']
  return comment
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
  return news.slug?.length > Const.MIN_SLUG_LENGTH ? news.slug : createSlug(news.caption);
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
  return ["Burak KALAFAT", "fatalarr@gmail.com", "ktuna17@outlook.com", "Mustafa Mir Çolakoğlu 🇹🇷", "burakkalafat@hotmail.com", "barisatmaca061@gmail.com", "Berker Küçük", "berkerkucuk1@gmail.com", "zaferhalatci@gmail.com","Abdulkadir Sarıkoç"];
}

export const ShowMedias = (content: string) => {
  const oembed = content.split('</oembed>');
  let body = '';
  oembed.forEach((item, index) => {
    body += oembed[index] + '</oembed>';
    const oembed1 = item.split('url="')[1];
    if (oembed1) {
      const oembed2 = oembed1.split('">')[0];
      if (oembed2) {
        const youtube = oembed2.split('https://www.youtube.com/watch?v=')[1];
        if (youtube) {
          body += '<div class="iframe-container"><iframe src="https://youtube.com/embed/' + youtube + '" allowfullscreen></iframe></div>';
        }
      }
    }
  });
  return body;
}

const createSlug = (text: string) : string => {
  let slug = slugifyMarkless(text)
  let isExistSlug : boolean = checkExistSlug(slug)
  let i = 1
  while (isExistSlug) {
    slug = slugifyMarkless(text) + '-' + i
    isExistSlug = checkExistSlug(slug)
    i++
  }

  return slug
}

const slugifyMarkless = (text: string) : string => {
  text = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
  if (text.endsWith('!') || text.endsWith('?') )
    return slugifyMarkless(text.substring(0, text.length - 1))
  return slugify(text)
}

const checkExistSlug = (slug: string) : boolean => {
  let news = getNewsBySlug(slug)
  return news ? true : false
}