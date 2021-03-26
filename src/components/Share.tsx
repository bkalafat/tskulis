import React from "react"
import * as Helper from '../utils/helper'
import Link from 'next/link'
import {
  FacebookShareButton,
  TelegramShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TelegramIcon,
  TwitterIcon,
  WhatsappIcon
} from "react-share"
import { NewsType } from "../types/NewsType"
import Image from "next/image"

const Share = ({ news }: { news: NewsType }) => {
  if (news) {
    return (
      <div className="share">
        <Link href="https://news.google.com/publications/CAAqBwgKMJy7mgswtsWyAw?hl=tr&gl=TR&ceid=TR%3Atr" >
          <div className="google-news">
            <span className="google-news-subscribe" >Abone Ol</span>
            <a className="google-news-button" rel="noopener noreferrer nofollow"
              target="_blank"><Image layout="intrinsic" width="68" height="12" src="/google-news.png" alt="image" /></a>
          </div>
        </Link>
        <FacebookShareButton
          url={Helper.getFullUrl(news)}
          quote={news.caption}
          hashtag={news.socialTags}
        >
          <FacebookIcon size="2.5rem" />
        </FacebookShareButton>
        <TwitterShareButton
          via="TsKulis"
          url={Helper.getFullUrl(news)}
          title={news.caption}
          hashtags={news.socialTags?.split(",").map((item: string) => item.trim())}
        >
          <TwitterIcon size="2.5rem" />
        </TwitterShareButton>
        <WhatsappShareButton
          url={Helper.getFullUrl(news)}
          title={news.caption}
        >
          <WhatsappIcon size="2.5rem" />
        </WhatsappShareButton>
        <TelegramShareButton
          url={Helper.getFullUrl(news)}
          title={news.caption}
        >
          <TelegramIcon size="2.5rem" />
        </TelegramShareButton>
      </div>
    )
  } else return <div />
}

export default Share
