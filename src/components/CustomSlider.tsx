import { useState } from "react"
import { isMobile } from "react-device-detect"
import Slider, { Settings } from "react-slick"
import { NewsType } from "../types/NewsType"
import { Arrow, Dots, Paging } from "../utils/sliderItem"
import SliderCard from "./cards/SliderCard"
import SquareAd from "./SquareAd"

const CustomSlider = ({ newsList }: { newsList: NewsType[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  var settings : Settings = {
    dots: true,
    dotsClass: "dotsClass",
    arrows: !isMobile,
    lazyLoad: 'progressive',
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    autoplay: true,
    autoplaySpeed: 4500,
    slidesToScroll: 1,
    nextArrow: <Arrow direction="right" />,
    prevArrow: <Arrow direction="left" />,
    beforeChange: (_prev, next) => {
      setCurrentIndex(next)
    },
    appendDots: Dots(),
    customPaging: (index: number) => {
      return Paging(index, currentIndex)
    }
  }

  return (
    <div style={{ marginBottom: 5 }}>
      <Slider {...settings}>
        {newsList.map((news, index) => (
          index % 8 == 0 ? SquareAd : SliderCard(news)
        ))}
      </Slider>
    </div>
  )
}

export default CustomSlider