import { NewsType } from "../types/NewsType"
import SubNewsCard from "./cards/SubNewsCard"
import Script from 'next/script'

const SubNews = ({ newsList }: { newsList: NewsType[] }) => {

  return (
    <div className="subNews clickable">
      {newsList.map((news) => (
        SubNewsCard(news)
      ))}
      <Script strategy="lazyOnload" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></Script>

      <ins className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-9881133041867885"
        data-ad-slot="5239195021"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
      <Script id="subNewsScript" strategy="lazyOnload">
        (adsbygoogle = window.adsbygoogle || []).push({ });
      </Script>
    </div>
  )
}

export default SubNews