import '../index.css'
import "bootstrap/dist/css/bootstrap.min.css"
import "slick-carousel/slick/slick.css"
import "slick-carousel/slick/slick-theme.css"
import '../content-styles.css'
import { Session } from "next-auth";


import { SessionProvider } from "next-auth/react"
import "reflect-metadata";
import type { AppProps } from 'next/app'


export default function MyApp({ Component, pageProps }: AppProps<{ session: Session;}>) {
  return <SessionProvider session={pageProps.session} refetchInterval={5 * 60} >
    <Component {...pageProps} />
  </SessionProvider>
}