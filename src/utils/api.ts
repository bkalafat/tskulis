import { getEnvironmentUrl, setDefaultValues } from "./helper"
import axios from "axios"
import fetch from 'isomorphic-unfetch'
import * as Const from "./constant"
import { NewsType } from "../types/NewsType"

export const getNewsList = (): Promise<NewsType[]> => {
  return fetch(getEnvironmentUrl() + "news/get").then(res => res.json())
}

export const getNews = (id: string): Promise<NewsType> => {
  return fetch(getEnvironmentUrl() + "news/get/" + id).then(res => res.json(), error => console.log(error))
}

export const getNewsBySlug = (slug: string): Promise<NewsType> => {
  return fetch(getEnvironmentUrl() + "news/GetBySlug/" + slug).then(res => res.json(), error => console.log(error))
}

export const upsertNews = (newNews: NewsType) => {
  if ("id" in newNews && newNews.id && newNews.id.length > 0) {
    return updateNews(newNews)
  } else {
    return insertNews(newNews)
  }
}

export const insertNews = (news: NewsType) => {
  setDefaultValues(news)
  return fetch(getEnvironmentUrl() + "news/post", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(news)
  }).then(()=> "ok", error => console.log(error))
}

export const updateNews = (news: NewsType) => {
  news.updateDate = new Date().toISOString()
  news.imgAlt = news.caption
  return fetch(getEnvironmentUrl() + "news/put/" + news.id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(news)
  }).then(() => "ok", error => console.log(error))
}

export const deleteNews = (id: string) => {
  return fetch(getEnvironmentUrl() + "news/delete/" + id, {
    method: "DELETE"
  }).then(() => "ok", error => console.log(error))
}

export const uploadFile = async (file: File) => {
  const formData = new FormData()
  formData.append("image", file, file.name)
  const res = await axios.post(Const.UPLOAD_FILE_PATH, formData)
  return res.data.fileUrl
}
