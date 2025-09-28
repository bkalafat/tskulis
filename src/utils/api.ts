import { getEnvironmentUrl, setDefaultCommentValues, setDefaultValues } from "./helper"
import axios from "axios"
import fetch from 'isomorphic-unfetch'
import * as Const from "./constant"
import { NewsType } from "../types/NewsType"
import { CommentType } from "../types/CommentType"

// Helper function for fetch with timeout
const fetchWithTimeout = (url: string, options: RequestInit = {}, timeoutMs: number = 10000): Promise<Response> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const fetchOptions: RequestInit = {
    ...options,
    signal: controller.signal,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers
    }
  }

  return fetch(url, fetchOptions)
    .then(res => {
      clearTimeout(timeoutId)
      return res
    })
    .catch(error => {
      clearTimeout(timeoutId)
      throw error
    })
}

export const getNewsList = (): Promise<NewsType[]> => {
  return fetchWithTimeout(getEnvironmentUrl() + "news")
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
      console.error('getNewsList error:', error.message || error)
      // Return empty array instead of throwing
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
  return fetchWithTimeout(getEnvironmentUrl() + "news")
    .then(res => {
      if (!res.ok) {
        console.error('getLastNewsList API Error:', res.status, res.statusText)
        return []
      }
      return res.json()
    })
    .then((news: NewsType[]) => {
      if (!Array.isArray(news)) {
        console.error('getLastNewsList API returned non-array data:', news)
        return []
      }
      return news.sort((a, b) => new Date(b.createDate || '').getTime() - new Date(a.createDate || '').getTime()).slice(0, 10)
    })
    .catch(error => {
      console.error('getLastNewsList error:', error.message || error)
      return []
    })
}

export const getNews = (id: string): Promise<NewsType | null> => {
  return fetchWithTimeout(getEnvironmentUrl() + "news/" + id)
    .then(res => {
      if (!res.ok) {
        console.error('getNews API Error:', res.status, res.statusText)
        return null
      }
      return res.json()
    })
    .catch(error => {
      console.error('getNews error:', error.message || error)
      return null
    })
}

export const getNewsBySlug = (slug: string): Promise<NewsType | null> => {
  return fetchWithTimeout(getEnvironmentUrl() + "news/by-url?url=" + slug)
    .then(res => {
      if (!res.ok) {
        console.error('getNewsBySlug API Error:', res.status, res.statusText)
        return null
      }
      return res.json()
    })
    .catch(error => {
      console.error('getNewsBySlug error:', error.message || error)
      return null
    })
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