import { isMobile } from "react-device-detect"
import Slider, { Settings } from "react-slick"
import { NewsType } from "../types/NewsType"
import { Arrow } from "../utils/sliderItem"
import SubSliderCard from "./cards/SubSliderCard"

const SubSlider = ({ newsList }: { newsList: NewsType[] }) => {
  var settings: Settings = {
    dots: true,
    arrows: !isMobile,
    lazyLoad: 'ondemand',
    infinite: true,
    slidesToShow: isMobile ? 2 : 3,
    slidesToScroll: 1,
    nextArrow: <Arrow direction="right" />,
    prevArrow: <Arrow direction="left" />
  }

  return (
    <div style={{ marginBottom: 40 }}>
      <Slider {...settings}>
        {newsList.map(news => (
          SubSliderCard(news)
        ))}
      </Slider>
    </div>
  )
}

export default SubSlider