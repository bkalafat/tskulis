
import Content from "../components/Content"
import Layout from "../components/Layout"
import Head from 'next/head'
import * as API from "../utils/api"
import { NewsType } from "../types/NewsType"
import { useEffect, useState } from "react"

const Index = () => {
  const [newsList, setNewsList] = useState<NewsType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true)
        const news = await API.getNewsList()
        setNewsList(news || [])
        setError(null)
      } catch (err) {
        console.error('Failed to fetch news:', err)
        setError('Haberler yüklenirken bir hata oluştu')
        setNewsList([])
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [])

  if (loading) {
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
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Yükleniyor...</h2>
            <p>Haberler yükleniyor, lütfen bekleyiniz.</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <Head>
          <title>TS Kulis - Trabzonspor, Futbol, Son Dakika Trabzonspor Haberler, Güncel Futbol Transferleri</title>
          <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        </Head>
        <div className="containerDesktop">
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Hata</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Tekrar Dene</button>
          </div>
        </div>
      </Layout>
    )
  }

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

export default Index
