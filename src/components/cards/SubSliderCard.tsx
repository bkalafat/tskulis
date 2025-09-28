import Link from "next/link";
import { isMobile } from "react-device-detect";
import * as Helper from '../../utils/helper';
import Image from "next/image";
import { NewsType } from "../../types/NewsType";
import { getImageProps } from "../../utils/imageUtils";

const SubSliderCard = (news: NewsType) => {
  return <div key={news.id} >
    <Link
      href={"../" + Helper.getFullSlug(news)}
      key={news.id}
    >

      <a>
        <div className="spaceAround">
          <Image 
            layout="responsive"
            {...getImageProps({
              src: news.imgPath,
              alt: news.imgAlt || `${news.caption} - TS Kulis`,
              width: 1500,
              height: 1000,
              category: news.category,
              caption: news.caption,
              className: isMobile ? "sameSizeImgMobile" : "sameSizeImgBrowser"
            })}
          />
          <div className="text ellipsis text-center">
            <span style={{ fontSize: isMobile ? "large" : "xx-large" }} className="text-concat">{news.caption}</span>
          </div>
        </div>
      </a>
    </Link>
  </div>
}

export default SubSliderCard