
import Content from "../components/Content"
import Layout from "../components/Layout"
import Head from 'next/head'
import * as API from "../utils/api"
import { NewsType } from "../types/NewsType"

const Index = ({newsList}: {newsList: NewsType[]}) => {
  return (
    <Layout>
      <Head>
        <title>TS Kulis - Trabzonspor, Futbol, Son Dakika Trabzonspor Haberler, Güncel Futbol Transferleri</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link rel="canonical" href="https://www.tskulis.com"></link>
        <meta name="title" content="Ts Kulis" />
        <meta name="description" content="Trabzonspor haberlerini bulabileceğiniz haber sayfası." />
        <meta property="og:image" content="/logo512.png" />
        <meta property="og:url" content="https://tskulis.com" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tskulis.com" />
        <meta property="og:title" content="TS Kulis" />
        <meta property="og:description" content="Trabzonspor haberlerini bulabileceğiniz haberi bul sayfası." />
        <meta name="twitter:url" content="https://tskulis.com" />
        <meta name="twitter:title" content="TS Kulis" />
        <meta name="twitter:description" content="Trabzonspor haberlerini bulabileceğiniz haberi bul sayfası." />
        <meta name="twitter:site" content="@tskulis" />
        <meta name="twitter:creator" content="@tskulis" />
        <meta name="keywords" content="Trabzonspor son dakika haberleri, en son haber, Trabzonspor, futbol, güncel, spor manşetleri"></meta>
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
    revalidate: 150,
    props: {
      newsList
    }
  }
}

export default Index
