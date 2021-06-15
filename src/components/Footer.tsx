import React, { FC } from "react"
import { SocialIcon } from "react-social-icons"
import Link from "next/link"

const Footer: FC = () => {
  return (
    <article>
      <footer>
        <div className="centerFlex">
          <div className="spaceAround">
            <SocialIcon
              url="https://www.facebook.com/tskulis"
              network="facebook"
            />
          </div>
          <div className="spaceAround">
            <SocialIcon
              url="https://twitter.com/tskulis61"
              network="twitter"
            />
          </div>
          <div className="spaceAround">
            <SocialIcon
              url="https://www.instagram.com/tskuliss"
              network="instagram"
            />
          </div>
        </div>
        <div className="centerFlex" >
          <div className="spaceAround">
            <Link href="/">
              <a>TS KULİS</a>
            </Link>
          </div>
          <div className="spaceAround">
            <Link href="/privacypolicy" as={"/privacypolicy"}><a>Privacy Policy</a></Link>
          </div>
          <div className="spaceAround">
            <Link href="/kunye" as={"/kunye"}><a>Künye</a></Link>
          </div>
        </div>
      </footer>
    </article>
  )
}

export default Footer
