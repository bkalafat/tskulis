import React, { FC } from "react"
import { NewsType } from "../types/NewsType"
import SubNewsCard from "./cards/SubNewsCard"

const SubNews : FC<{ newsList: NewsType[] }> = ({ newsList }: { newsList: NewsType[] }) => {

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
      <script>
        (adsbygoogle = window.adsbygoogle || []).push({ });
      </script>
    </div>
  )
}

export default SubNews