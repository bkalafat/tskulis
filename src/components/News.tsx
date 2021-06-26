import CustomSlider from "./CustomSlider"
import SubSlider from "./SubSlider"
import SubNews from "./SubNews"
import SquareAd from "./SquareAd"
import { NewsType } from "../types/NewsType"
import { TYPE } from "../utils/enum"
import { sortCreateDateDesc } from "../utils/helper"

const News = ({ newsList }: { newsList: NewsType[] }) => {
  if (!newsList && newsList.length === 0) return <div />

  const mainNews = newsList
    .filter(
      news =>
        !news.isSecondPageNews &&
        news.isActive &&
        news.type === TYPE.NEWS
    )
    .sort(sortCreateDateDesc())

  const headlines = newsList
    .filter(
      news =>
        !news.isSecondPageNews && news.isActive && news.type === TYPE.HEADLINE
    )
    .sort(sortCreateDateDesc())
  const sliderNewsList = mainNews.slice(0, 13)

  const subNewsList = newsList
    .filter(
      news =>
        !news.isSecondPageNews &&
        news.isActive &&
        news.type === TYPE.SUB_NEWS
    )
    .sort(sortCreateDateDesc())
    .slice(0, 64)
  const extraNews = mainNews.slice(13, 26)
  const subSliderNews = headlines.concat(extraNews).slice(0, 12)

  return (
    <div className="centerFlex">
      <div className="col-md-10 col-xl-10 noPadding ">
        <CustomSlider newsList={sliderNewsList} />
        <SubSlider newsList={subSliderNews} />
      </div>
      <div>
        <SquareAd />
        <SubNews newsList={subNewsList} />
      </div>
    </div>
  )
}

export default News
