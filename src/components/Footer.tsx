import React from "react"
import { SocialIcon } from "react-social-icons"
import Link from "next/link"
import Image from "next/image"

const size = 33
const Footer = () => {
  return (
    <article>
      <footer>
        <div className="centerFlex">
          <div className="spaceAround">
            <SocialIcon
              rel="noopener noreferrer nofollow"
              url="https://www.facebook.com/tskulis"
              target="_blank"
              style={{ height: size, width: size }}
              network="facebook"
            />
          </div>
          <div className="spaceAround">
            <SocialIcon
              url="https://twitter.com/tskulis61"
              rel="noopener noreferrer nofollow"
              target="_blank"
              style={{ height: size, width: size }}
              network="twitter"
            />
          </div>
          <div className="spaceAround">
            <SocialIcon
              url="https://www.instagram.com/tskuliss"
              rel="noopener noreferrer nofollow"
              target="_blank"
              style={{ height: size, width: size }}
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
        </div>
      </footer>
    </article>
  )
}

export default Footer
