import React, { FC } from "react";
import Link from "next/link";
import { BrowserView, MobileView, isMobile } from "react-device-detect";
import Image from "next/image";
import * as Helper from '../../utils/helper';
import { NewsType } from "../../types/NewsType";

const SubNewsCard: FC<NewsType> = (news: NewsType) => {
  return <div
    className="col-xs-12 col-sm-12 col-md-4 subNews-child relativeDiv"
    key={news.id}
  >
    <Link
      href={"../" + Helper.getFullSlug(news)}
    >
      <a>
        <Image
          width="1920" height="1080"
          className="stretchImg shadow"
          alt={news.imgAlt}
          src={news.imgPath} />
        <div className="sub-header-text">
          <div className={isMobile ? "text-center" : "col-md-12 text-center"}>
            <BrowserView>
              <h2 className="h4">
                <span>{news.caption}</span>
              </h2>
            </BrowserView>
            <MobileView>
              <h5>
                <span>{news.caption}</span>
              </h5>
            </MobileView>
          </div>
        </div>
      </a>
    </Link>
  </div>
}

export default SubNewsCard