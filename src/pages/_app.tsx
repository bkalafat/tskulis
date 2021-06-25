import '../index.css'
import "bootstrap/dist/css/bootstrap.min.css"
import "slick-carousel/slick/slick.css"
import "slick-carousel/slick/slick-theme.css"

import { Provider } from 'next-auth/client'
import "reflect-metadata";
import type { AppProps } from 'next/app'


export default function MyApp({ Component, pageProps }: AppProps) {
  return <Provider session={pageProps.session}>
    <Component {...pageProps} />
  </Provider>
}