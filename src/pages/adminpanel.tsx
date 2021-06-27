import React, { useState, useEffect } from "react"
import BootstrapTable from "react-bootstrap-table-next"
import { MIN_SLUG_LENGTH } from "../utils/constant"
import * as API from "../utils/api"
import Router from 'next/router'
import { signIn, signOut, useSession } from 'next-auth/client'
import { getAdmins } from "../utils/helper"
import { NewsType } from "../types/NewsType"
import { TYPE } from "../utils/enum"

const AdminPanel = ({ newsListParam }: { newsListParam: NewsType[] }) => {
  const [session] = useSession()
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

  const defaultSorted = [
    {
      dataField: "createDate",
      order: "desc"
    }
  ]

  const rowEvents = {
    onClick: (_e, row : NewsType) => {
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
      {session && admins.includes(session.user.email.toLowerCase()) && <>
        Signed in as {session.user.email} <br />
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
    </div>

  }
  return <></>
}

export const getStaticProps = async () => {
  const newsList = await API.getNewsList()
  return {
    revalidate: 15,
    props: {
      newsList
    }
  }
}

export default AdminPanel