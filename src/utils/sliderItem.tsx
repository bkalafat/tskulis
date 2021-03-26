import { CSSProperties } from "react"
import Pagination from "react-bootstrap/Pagination"

export const Arrow = ({ className, style, onClick, direction }: {
  className?: string,
  style?: CSSProperties,
  onClick?: any,
  direction: string
}) => {
  return (
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
