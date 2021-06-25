import React, { FC, useEffect } from "react"
import { NewsType } from "../types/NewsType"
import SubNewsCard from "./cards/SubNewsCard"

declare global {
  interface Window {
    adsbygoogle: {[key: string]: unknown}[]
  }
}

const SubNews : FC<{ newsList: NewsType[] }> = ({ newsList }: { newsList: NewsType[] }) => {

  useEffect(()=> {
    if(typeof window !== 'undefined'){
          (window.adsbygoogle = window.adsbygoogle || []).push({})
    }
}, [])

  return (
    <div className="subNews clickable">
      {newsList.map((news) => (
        SubNewsCard(news)
      ))}
      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>

      <ins className="adsbygoogle"
        style={{display:"block"}}
        data-ad-client="ca-pub-9881133041867885"
        data-ad-slot="5239195021"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
    </div>
  )
}

export default SubNews

