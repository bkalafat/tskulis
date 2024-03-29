import React, { useState, useEffect } from "react"
import BootstrapTable, { SortOrder } from "react-bootstrap-table-next"
import { MIN_SLUG_LENGTH, TIMEOUT } from "../utils/constant"
import * as API from "../utils/api"
import Router from 'next/router'
// import { signIn, signOut, useSession } from 'next-auth/client'
import { useSession, signIn, signOut } from "next-auth/react"
import { getAdmins } from "../utils/helper"
import { NewsType } from "../types/NewsType"
import { TYPE } from "../utils/enum"

const AdminPanel = ({ newsListParam }: { newsListParam: NewsType[] }) => {
  const session = useSession().data
  const [newsList, setNewsList] = useState<NewsType[]>(newsListParam)

  useEffect(() => {
    API.getNewsList().then(result => {
      setNewsList(result)
    })
  }, [])

  const navigateForCreate = () => Router.push("/editor/new")
  const navigateForUpdate = (news: NewsType) => news.slug?.length > MIN_SLUG_LENGTH ? Router.push("/editor/" + news.slug + "$") : Router.push("/editor/" + news.id)

  function typeFormatter(type: string) {
    if (type === TYPE.NEWS) {
      return "Ana Haber"
    } else {
      return "Alt Haber"
    }
  }

  const columns = [
    {
      dataField: "caption",
      text: "Başık",
      sort: true
    },
    {
      dataField: "authors",
      text: "Yazarlar"
    },
    {
      dataField: "type",
      text: "Tip",
      formatter: typeFormatter
    },
    {
      dataField: "category",
      text: "Kategori"
    },
    {
      dataField: "createDate",
      text: "Oluşturma tarihi",
      sort: true
    },
    {
      dataField: "isActive",
      text: "Durum"
    }
  ]

  const defaultSorted : [{ dataField: any; order: SortOrder }] = [
    {
      dataField: "createDate",
      order: "desc"
    }
  ]

  const rowEvents = {
    onClick: (_e: any, row : NewsType) => {
      navigateForUpdate(row)
    }
  }
  if (newsList) {
    const admins = getAdmins();
    return <div className="center-item">
      {!session && <>
        Not admins signed in <br />
        <button onClick={() => signIn()}>Sign in</button>
      </>}
      {session && admins.includes(session.user.name) && <>
        Signed in as {session.user.name} <br />
        <button onClick={() => signOut()}>Sign out</button> <br />
        <input
          onClick={navigateForCreate}
          type="submit"
          value="Yeni Haber Ekle"
        />
        <BootstrapTable
          bootstrap4
          keyField="id"
          data={newsList}
          columns={columns}
          defaultSorted={defaultSorted}
          rowEvents={rowEvents}
          striped
          hover
          condensed
        /></>}
        {session && !admins.includes(session.user.name) && <>
        {session.user.name} <br />
        Admin değilsiniz <br />
        Yazılımcıya ekran görüntüsü at seni eklesin.
      </>}
    </div>

  }
  return <></>
}

export const getStaticProps = async () => {
  const newsList = await API.getNewsList()
  return {
    revalidate: TIMEOUT,
    props: {
      newsList
    }
  }
}

export default AdminPanel