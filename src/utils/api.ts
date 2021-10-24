import { getEnvironmentUrl, setDefaultCommentValues, setDefaultValues } from "./helper"
import axios from "axios"
import fetch from 'isomorphic-unfetch'
import * as Const from "./constant"
import { NewsType } from "../types/NewsType"
import { CommentType } from "../types/CommentType"

export const getNewsList = (): Promise<NewsType[]> => {
  return fetch(getEnvironmentUrl() + "news/get").then(res => res.json())
}

export const getCommentList = (): Promise<CommentType[]> => {
  return fetch(getEnvironmentUrl() + "comment/get").then(res => res.json())
}

export const getCommentsBySlug = (slug: string): Promise<CommentType[]> => {
  return fetch(getEnvironmentUrl() + "comment/GetBySlug/" + slug).then(res => res.json(), error => console.log(error))
}

export const getCommentsByNewsId = (newsId: string): Promise<CommentType[]> => {
  return fetch(getEnvironmentUrl() + "comment/GetByNewsId/" + newsId).then(res => res.json(), error => console.log(error))
}

export const getLastNewsList = (): Promise<NewsType[]> => {
  return fetch(getEnvironmentUrl() + "news/GetLastNews").then(res => res.json())
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
  }).then(() => "ok", error => console.log(error))
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

export const insertComment = (comment: CommentType) => {
  setDefaultCommentValues(comment)
  return fetch(getEnvironmentUrl() + "comment/post", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(comment)
  }).then(() => "ok", error => console.log(error))
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