import Share from "../../components/Share"
import Layout from "../../components/Layout"
import Head from "next/head"
import SquareAd from "../../components/SquareAd"
import { NewsType } from "../../types/NewsType"
import Image from "next/image";
import { generateUrlWithoutId, getCategoryToByKey } from "../../utils/helper"
import { getNewsBySlug, getNewsList } from "../../utils/api"
import { MIN_SLUG_LENGTH } from "../../utils/constant"

const NewsDetail = ({ news }: { news: NewsType }) => {
  if (news && news.createDate) {
    let [y, m, d, hh, mm, ss, ms] = news.createDate.match(/\d+/g)
    let date = new Date(Date.UTC(+y, +m - 1, +d, +hh, +mm, +ss, +ms))
    let formatted = date.toLocaleString()
    const url = generateUrlWithoutId(news)
    return (
      <Layout>
        <Head>
          <title>{news.caption}</title>
          <meta name="viewport" content="initial-scale=1.0, width=device-width" />
          <meta name="title" content={news.caption} />
          <meta name="description" content={news.summary} />
          <meta property="og:image" content={news.imgPath} />
          <meta property="og:url" content={url} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={url} />
          <meta property="og:title" content={news.caption} />
          <meta property="og:description" content={news.summary} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:url" content={url} />
          <meta property="twitter:title" content={news.caption} />
          <meta property="twitter:description" content={news.summary + " #tskulis"} />
          <meta name="keywords" content={news.keywords ? news.keywords : news.caption.split(' ').join(', ')} />
        </Head>
        <div className="newsDetail">
          <h1 className="spaceAround">{news.caption}</h1>
          <p className="lead spaceAround">{news.summary}</p>
          <div className="center-item col-md-6 col-xs-12 col-sm-12 ">
            <Image
              width="1500" height="1000"
              className="detailImg"
              src={news.imgPath}
              alt={news.imgAlt}
            /></div>
          <Share news={news}></Share>
          <SquareAd />
        </div>
        <div
          className="container"
          onContextMenu={e => e.preventDefault()}
          dangerouslySetInnerHTML={{
            __html:
              "<div class='container content'" +
              news.content +
              "</div>"
          }}
        />
        <div className='container content center-item  text-center'>
          <SquareAd />
          <time className="time" dateTime={news.createDate}>Haber Giriş: {formatted}</time>
        </div>
      </Layout>
    )
  } else return <Layout>
    <Head>
      <title>Detay</title>
    </Head>
  </Layout>
}

export async function getStaticPaths() {
  const newsList = await getNewsList()
  const paths = newsList.filter(n => n.slug?.length >= MIN_SLUG_LENGTH).map((news) => ({
    params: { category: getCategoryToByKey(news.category), slug: news.slug }
  }))
  return { paths, fallback: true }
}

export const getStaticProps = async ({ params }) => {
  const news = await getNewsBySlug(params.slug)

  return {
    revalidate: 10,
    props: {
      news
    }
  }
}

export default NewsDetail