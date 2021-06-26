import { CSSProperties } from "react"
import Pagination from "react-bootstrap/Pagination"

export const Arrow = ({ className, style, onClick, direction }: {
  className?: string,
  style?: CSSProperties,
  onClick?: any,
  direction: string
}) => {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      style={{ ...style }}
      alt={`${direction} arrow`}
      src={`/${direction}Arrow.png`}
      onClick={onClick}
    />
  )
}

export const Dots = () => {
  // eslint-disable-next-line react/display-name
  return dots => {
    return (
      <Pagination className="centerFlex" size="sm">
        {dots}
      </Pagination>
    )
  }
}

export const Paging = (index: number, currentSlide: number) => {
  return (
    <ul style={{ listStyle: "none" }} >
      <Pagination.Item key={index} active={index === currentSlide}>
        {index + 1}
      </Pagination.Item>
    </ul>
  )
}
