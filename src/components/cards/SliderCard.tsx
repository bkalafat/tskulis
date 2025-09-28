import Link from "next/link";
import { BrowserView, MobileView } from "react-device-detect";
import * as Helper from '../../utils/helper';
import { NewsType } from "../../types/NewsType";
import Image from 'next/image'
import { getImageProps } from "../../utils/imageUtils";

const SliderCard = (news: NewsType) => {
  return <div key={news.id} className="ratio">
    <Link
      href={"../" + Helper.getFullSlug(news)}
      key={news.id}
    >
      <a>
        <Image 
          layout="responsive" 
          {...getImageProps({
            src: news.imgPath,
            alt: news.imgAlt || `${news.caption} - TS Kulis`,
            width: 1920,
            height: 1080,
            category: news.category,
            caption: news.caption,
            className: "imgRatio"
          })}
        />
        <div className="header-text">
          <div className="col-md-12 col-sm-8 col-xs-8 noPadding text-center">
            <BrowserView>
              <h4>
                <span className="beyaz-manset">{news.caption}</span>
              </h4>
            </BrowserView>
            <MobileView>
              <h6>
                <span className="beyaz-manset">{news.caption}</span>
              </h6>
            </MobileView>
          </div>
        </div>
      </a>
    </Link>
  </div>
}

export default SliderCard