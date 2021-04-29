import SubSlider from "./SubSlider"
import SubNews from "./SubNews"
import { getEnvironmentUrl, getCategoryByTo, sortCreateDateDesc } from "../utils/helper"
import useSWR from "swr"
import Head from "next/head"
import { useRouter } from 'next/router'
import SquareAd from "./SquareAd"
import { NewsType } from "../types/NewsType"
import { TYPE } from "../utils/enum"

const CategoryNews = () => {
  const { data, error } = useSWR<NewsType[], any>(getEnvironmentUrl() + "news/get")
  const router = useRouter()
  const { category } = router.query
  const categoryUrl = Array.isArray(category) ? category[0] : category;

  if (error || !data || categoryUrl == undefined) {
    return (
      <><Head><title>{categoryUrl}</title></Head><div>Yükleniyor...</div></>
    )
  }
  else {
    if (!data && data.length === 0)
      return (<><Head><title>{categoryUrl}</title></Head><div>Haber bulunamadı</div></>)

    const categoryObj = getCategoryByTo(categoryUrl)
    const newsList = data.filter(news => news.category === categoryObj.key)
    const mainNews = newsList
      .filter(
        news =>
          news.isActive && (news.type === TYPE.NEWS || news.type === TYPE.HEADLINE)
      )
      .sort(sortCreateDateDesc())
    const sliderNewsList = mainNews

    const extraNews = mainNews.slice(13, 26)

    const tempNewsList = newsList
      .filter(news => news.isActive && news.type === TYPE.SUB_NEWS)
      .concat(extraNews)
      .sort(sortCreateDateDesc())
    const subNewsList = tempNewsList

    let upperCaseCategory = categoryUrl;
    upperCaseCategory = `${upperCaseCategory[0].toUpperCase()}${upperCaseCategory.substring(1)}`;

    return (
      <>
        <Head>
          <title>{upperCaseCategory + " haberi bul, son dakika " + upperCaseCategory + " gelişmeleri"}</title>
          <link rel="shortcut icon" href="/favicon.ico" />
          <meta name="viewport" content="initial-scale=1.0, width=device-width" />
          <meta name="title" content="Ts Kulis" />
          <meta name="description" content={categoryObj.value + " haberlerini bulabileceğiniz haberi bul sayfası."} />
          <meta property="og:image" content="/logo512.png" />
          <meta property="og:url" content={"https://tskulis.com/" + categoryObj.to} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={"https://tskulis.com" + categoryObj.to} />
          <meta property="og:title" content="tskulis.com" />
          <meta property="og:description" content={categoryObj.value + " haberlerini bulabileceğiniz haberi bul sayfası."} />
          <meta property="twitter:card" content="summary_large_image" />
          <meta property="twitter:url" content={"https://tskulis.com/" + categoryObj.to} />
          <meta property="twitter:title" content="tskulis.com" />
          <meta property="twitter:description" content={categoryObj.value + " haberlerini bulabileceğiniz haberi bul sayfası."} />
        </Head>
        <div className="center">
          <h2>{categoryObj.value}</h2>
        </div>
        <div className="centerFlex">
          <div className="col-md-10 col-xl-10 noPadding">
            <SubSlider newsList={sliderNewsList.slice(0, 13)} />
          </div>
          <SquareAd />
          <SubNews newsList={subNewsList.slice(0, 32)}></SubNews>
        </div>
      </>
    )
  }
}

export default CategoryNews