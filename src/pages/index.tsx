
import Content from "../components/Content"
import Layout from "../components/Layout"
import Head from 'next/head'
import * as API from "../utils/api"
import { NewsType } from "../types/NewsType"

const Index = ({newsList}: {newsList: NewsType[]}) => {
  return (
    <Layout>
      <Head>
        <title>TsKulis - Haber, Son Dakika Haberler, Güncel Gazete Haberleri</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link rel="canonical" href="https://www.haberibul.com"></link>
        <meta name="title" content="Haberibul.com" />
        <meta name="description" content="Ulusal Spor Magazin Ekonomi Futbol Canlı Son Dakika haberlerini bulabileceğiniz haber sayfası." />
        <meta property="og:image" content="/logo512.png" />
        <meta property="og:url" content="https://haberibul.com" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://haberibul.com" />
        <meta property="og:title" content="Haberibul.com" />
        <meta property="og:description" content="Ulusal Spor Magazin Ekonomi Futbol Canlı Son Dakika haberlerini bulabileceğiniz haberi bul sayfası." />
        <meta name="twitter:url" content="https://haberibul.com" />
        <meta name="twitter:title" content="Haberibul.com" />
        <meta name="twitter:description" content="Ulusal Spor Magazin Ekonomi Futbol Canlı Son Dakika haberlerini bulabileceğiniz haberi bul sayfası." />
        <meta name="twitter:site" content="@HaberibulCom" />
        <meta name="twitter:creator" content="@HaberibulCom" />
        <meta name="keywords" content="haberi bul, haber bul, haberibul, haberbul, haber, güncel haberler, son dakika haberleri, en son haber, Türkiye, siyaset, güncel, spor, ekonomi, gazete manşetleri"></meta>
      </Head>
      <div className="containerDesktop">
        <Content newsList={newsList} />
      </div>
    </Layout>
  )
}

export const getStaticProps = async () => {
  const newsList = await API.getNewsList()
  return {
    revalidate: 250,
    props: {
      newsList
    }
  }
}

export default Index