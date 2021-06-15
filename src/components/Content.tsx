import { FC } from "react"
import { NewsType } from "../types/NewsType"
import News from "./News"

const Content: FC<{ newsList: NewsType[] }> = ({ newsList }: { newsList: NewsType[] }) => {
  if (!newsList) {
    return <div>Loading...</div>
  } else {
    return <News newsList={newsList} />
  }
}

export default Content
