import React, { useState } from "react"
import { isMobile } from "react-device-detect"
import Slider from "react-slick"
import { NewsType } from "../types/NewsType"
import { Arrow, Dots, Paging } from "../utils/sliderItem"
import SliderCard from "./cards/SliderCard"

const CustomSlider = ({ newsList }: { newsList: NewsType[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  var settings = {
    dots: true,
    dotsClass: "dotsClass",
    arrows: !isMobile,
    lazyLoad: true,
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
        {newsList.map(news => (
          SliderCard(news)
        ))}
      </Slider>
    </div>
  )
}

export default CustomSlider