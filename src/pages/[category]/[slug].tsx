import Share from "../../components/Share"
import Layout from "../../components/Layout"
import Head from "next/head"
import SquareAd from "../../components/SquareAd"
import SubNews from "../../components/SubNews"
import CommentArea from "../../components/CommentArea"
import { NewsType } from "../../types/NewsType"
import Image from "next/image";
import { generateUrlWithoutId, getCategoryToByKey, ShowMedias } from "../../utils/helper"
import { getCommentsBySlug, getLastNewsList, getNewsBySlug, getNewsList } from "../../utils/api"
import { MIN_SLUG_LENGTH, TIMEOUT } from "../../utils/constant"
import { CommentType } from "../../types/CommentType"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { getImageProps } from "../../utils/imageUtils"

const NewsDetail = () => {
  const router = useRouter()
  const { slug } = router.query
  
  const [news, setNews] = useState<NewsType | null>(null)
  const [lastNewsList, setLastNewsList] = useState<NewsType[]>([])
  const [comments, setComments] = useState<CommentType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const [newsData, lastNews, commentsData] = await Promise.all([
          getNewsBySlug(slug as string),
          getLastNewsList(),
          getCommentsBySlug(slug as string)
        ])
        
        setNews(newsData)
        setLastNewsList(lastNews || [])
        setComments(commentsData || [])
        setError(null)
      } catch (err) {
        console.error('Detail page fetch error:', err)
        setError('Haber yüklenirken bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug])

  if (loading) {
    return (
      <Layout>
        <Head>
          <title>Yükleniyor... - TS Kulis</title>
        </Head>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Yükleniyor...</h2>
          <p>Haber detayı yükleniyor, lütfen bekleyiniz.</p>
        </div>
      </Layout>
    )
  }

  if (error || !news) {
    return (
      <Layout>
        <Head>
          <title>Hata - TS Kulis</title>
        </Head>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Hata</h2>
          <p>{error || 'Haber bulunamadı'}</p>
          <button onClick={() => router.back()}>Geri Dön</button>
        </div>
      </Layout>
    )
  }
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
              {...getImageProps({
                src: news.imgPath,
                alt: news.imgAlt || `${news.caption} - TS Kulis`,
                width: 1500,
                height: 1000,
                category: news.category,
                caption: news.caption,
                className: "detailImg",
                priority: true
              })}
            /></div>
          <Share news={news}></Share>
          <SquareAd />
        </div>
        <div
          className="container"
          onContextMenu={e => e.preventDefault()}
          dangerouslySetInnerHTML={{
            __html:
              "<div class='ck-content'> " + ShowMedias(news.content) +
              " </div>"
          }}
        />
        <div className='container content center-item text-center'>
          <SquareAd />
          <time className="time" dateTime={news.createDate}>Haber Giriş: {formatted}</time>
          <SubNews newsList={lastNewsList.filter(
            n =>
              n.id != news.id &&
              n.isActive
          )} />
          <CommentArea newsId={news.id} comments={comments} />
        </div>
      </Layout>
    )
  } else return <Layout>
    <Head>
      <title>Detay</title>
    </Head>
  </Layout>
}

export default NewsDetail