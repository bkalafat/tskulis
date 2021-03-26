import React from "react";
import Link from "next/link";
import { isMobile } from "react-device-detect";
import * as Helper from '../../utils/helper';
import Image from "next/image";
import { NewsType } from "../../types/NewsType";

const SubSliderCard = (news: NewsType) => {
  return <div key={news.id} >
    <Link
      href={Helper.getHrefModel(news.url.length)}
      as={Helper.getFullSlug(news)}
      key={news.id}
    >

      <a>
        <div className="spaceAround">
          <Image layout="responsive"
            width="1500" height="1000"
            className={isMobile ? "sameSizeImgMobile" : "sameSizeImgBrowser"}
            src={news.imgPath}
            alt={news.imgAlt} />
          <div className="text ellipsis text-center">
            <span style={{ fontSize: isMobile ? "large" : "xx-large" }} className="text-concat">{news.caption}</span>
          </div>
        </div>
      </a>
    </Link>
  </div>
}

export default SubSliderCard