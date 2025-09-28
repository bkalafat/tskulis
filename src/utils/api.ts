import { getEnvironmentUrl, setDefaultCommentValues, setDefaultValues } from "./helper"
import axios from "axios"
import fetch from 'isomorphic-unfetch'
import * as Const from "./constant"
import { NewsType } from "../types/NewsType"
import { CommentType } from "../types/CommentType"

export const getNewsList = (): Promise<NewsType[]> => {
  return fetch(getEnvironmentUrl() + "news")
    .then(res => {
      if (!res.ok) {
        console.error('API Error:', res.status, res.statusText)
        return []
      }
      return res.json()
    })
    .then(data => {
      // Ensure we always return an array
      if (!Array.isArray(data)) {
        console.error('API returned non-array data:', data)
        return []
      }
      return data
    })
    .catch(error => {
      console.error('getNewsList error:', error)
      return []
    })
}

export const getCommentList = (): Promise<CommentType[]> => {
  // Comments not implemented in new backend yet
  return Promise.resolve([])
}

export const getCommentsBySlug = (slug: string): Promise<CommentType[]> => {
  // Comments not implemented in new backend yet
  return Promise.resolve([])
}

export const getCommentsByNewsId = (newsId: string): Promise<CommentType[]> => {
  // Comments not implemented in new backend yet
  return Promise.resolve([])
}

export const getLastNewsList = (): Promise<NewsType[]> => {
  // Backend doesn't have GetLastNews endpoint, so we get all news and sort by date
  return fetch(getEnvironmentUrl() + "news").then(res => res.json()).then((news: NewsType[]) => {
    return news.sort((a, b) => new Date(b.createDate || '').getTime() - new Date(a.createDate || '').getTime()).slice(0, 10)
  })
}

export const getNews = (id: string): Promise<NewsType> => {
  return fetch(getEnvironmentUrl() + "news/" + id).then(res => res.json(), error => console.log(error))
}

export const getNewsBySlug = (slug: string): Promise<NewsType> => {
  return fetch(getEnvironmentUrl() + "news/by-url?url=" + slug).then(res => res.json(), error => console.log(error))
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
  return fetch(getEnvironmentUrl() + "news", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(news)
  }).then(() => "ok", error => console.log(error))
}

export const updateNews = (news: NewsType) => {
  news.updateDate = new Date().toISOString()
  news.imgAlt = news.caption
  return fetch(getEnvironmentUrl() + "news/" + news.id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(news)
  }).then(() => "ok", error => console.log(error))
}

export const deleteNews = (id: string) => {
  return fetch(getEnvironmentUrl() + "news/" + id, {
    method: "DELETE"
  }).then(() => "ok", error => console.log(error))
}

export const insertComment = (comment: CommentType) => {
  // Comments not implemented in new backend yet
  setDefaultCommentValues(comment)
  return Promise.resolve("ok")
}

export const uploadFile = async (file: File) => {
  const formData = new FormData()
  formData.append("image", file, file.name)
  const res = await axios.post<{fileUrl: string}>(Const.UPLOAD_FILE_PATH, formData)
  console.log(res.data)
  return res.data.fileUrl
}

export async function createFile(url: string, fileName: string, type: string) {
  let response = await fetch(url);
  let blobData = await response.blob();
  let metadata = {
    type
  };
  return new File([blobData], fileName, metadata);
}