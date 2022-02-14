import { useState, useEffect, useRef, ChangeEvent } from "react"
import { Form, Button } from "react-bootstrap"
import * as Const from "../../utils/constant"
import * as API from "../../utils/api"
import * as Helper from "../../utils/helper"
import Resizer from "react-image-file-resizer"
import UploadAdapter from "../../utils/UploadAdapter"
import Router, { useRouter } from 'next/router'
import { useSession, signIn, signOut } from "next-auth/react"
import { getAdmins } from "../../utils/helper"
import { CATEGORY, TYPE } from "../../utils/enum"
import Popup from 'reactjs-popup'
import 'reactjs-popup/dist/index.css'

const NewsEditor = () => {
  const session = useSession().data
  const fileInput = useRef(null)
  const router = useRouter()
  const { id } = router.query
  const urlId = Array.isArray(id) ? id[0] : id
  const isUpdate = urlId && urlId != 'new';
  const [newNews, setNews] = useState(Const.DEFAULT_NEWS)
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  let tempImgPath;

  const handleImage = async (imageUri: any) => {
    const image = await Helper.convertFile(imageUri, "tskulis-" + selectedImg.name + '.webp')
    setNews({ ...newNews, imgPath: await API.uploadFile(image) })
    setSubmitting(true)
  }
  const [isSubmitting, setSubmitting] = useState(false)
  const [selectedImg, setSelectedImg] = useState<File>(null)

  const editorRef = useRef<any>()
  const [editorLoaded, setEditorLoaded] = useState(false)
  const { CKEditor, ClassicEditor } = editorRef.current || {}

  const watermarkRef = useRef<any>()
  const { watermark } = watermarkRef.current || {}

  useEffect(() => {
    editorRef.current = {
      CKEditor: require('@ckeditor/ckeditor5-react').CKEditor,
      ClassicEditor: require('@ckeditor/ckeditor5-build-classic')
    }
    watermarkRef.current = {
      watermark: require('watermarkjs')
    }
    if (isUpdate && !newNews.id) {
      if (urlId.includes('$')) {
        API.getNewsBySlug(urlId.slice(0, -1)).then(
          res => {
            setNews(res)
          }
        )
      }
      else {
        API.getNews(urlId).then(
          res => {
            setNews(res)
          }
        )
      }
    }
    setEditorLoaded(true)
    if (isSubmitting) {
      API.upsertNews(newNews).then(() => {
        Router.push("/adminpanel")
      })
    }
    if (isSubmitting) setSubmitting(false)
  }, [isSubmitting, isUpdate, newNews, urlId])
  const handleSubmit = e => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
    }
    else {
      setValidated(true);
    }
    const currentAuthor = session.user.name

    if (!newNews.authors.includes(currentAuthor) && currentAuthor !== "") {
      setNews({ ...newNews, authors: [...newNews.authors.filter(x => x !== ""), currentAuthor] })
    }
    if (validateInputs())
      if (selectedImg && selectedImg.name && newNews.imgPath !== Const.BreakingNewsImgPath) {
        upsertImage(selectedImg)
      } else if (isUpdate || newNews.imgPath === Const.BreakingNewsImgPath) {
        setSubmitting(true)
      }
  }
  const upsertImage = async (selectedImg: File) => {
    const imgBlob = await putWatermark(selectedImg)
    resizeImage(imgBlob)
  }
  const putWatermark = async (image: File): Promise<Blob> => {
    return await watermark([image])
      .blob(watermark.text.upperRight('TsKulis.com', '24px serif', '#a3a3a3', 0.3))
  }
  const resizeImage = (imgBlob: Blob) => {
    Resizer.imageFileResizer(imgBlob, 1280, 800, "JPEG", 90, 0,
      uri => handleImage(uri),
      "base64"
    )
  }
  const validateInputs = (): boolean => {
    let validationMessages: string[] = []
    if (!isUpdate && (!selectedImg || !selectedImg.name) && newNews.imgPath !== Const.BreakingNewsImgPath) {
      validationMessages.push("Lütfen fotoğraf ekleyiniz!")
    }
    if (newNews.content.length <= 45) {
      validationMessages.push("İçerik 45 karakterden uzun olmalıdır!")
    }
    if (newNews.summary.length <= 10) {
      validationMessages.push("Özet 10 karakterden uzun olmalıdır!")
    }
    if (newNews.caption.length <= 9) {
      validationMessages.push("Başlık 9 karakterden uzun olmalıdır!")
    }
    if (validationMessages.length > 0) {
      setErrorMessages(validationMessages)
      return false;
    }
    validationMessages = []
    setErrorMessages(validationMessages)
    return true;
  }
  const [validated, setValidated] = useState(false);
  const fileSelectorHandler = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedImg(event.target.files[0])
  }
  const toggleLastMinuteImg = async () => {
    if (newNews.imgPath === Const.BreakingNewsImgPath) {
      setNews({ ...newNews, imgPath: tempImgPath })
    }
    else {
      tempImgPath = newNews.imgPath;
      setNews({ ...newNews, imgPath: Const.BreakingNewsImgPath, imgAlt: "Son Dakika Resmi" })
    }
  }
  const admins = getAdmins();
  return (
    <div>
      {!session && <>
        Not admins signed in <br></br>
        <button onClick={() => signIn()}>Sign in</button>
      </>}
      {session && admins.includes(session.user.name) && <>
        Signed in as {session.user.name} <br />
        <button onClick={() => signOut()}>Sign out</button> <br />
        <div className="center">
          <Button
            variant={selectedImg ? "info" : "primary"}
            onClick={() => fileInput.current.click()}
            disabled={newNews.imgPath === Const.BreakingNewsImgPath}
          >
            {isUpdate ? "Fotoğrafı Güncelle" : "Fotoğraf Ekle"}
          </Button>
          <p>{selectedImg ? selectedImg.name : "Fotoğraf Seç"}</p>
          <Button
            variant={newNews.imgPath === Const.BreakingNewsImgPath ? "info" : "primary"}
            onClick={() => toggleLastMinuteImg()}
          >
            Son Dakika Foto
          </Button>
        </div>
        <input
          ref={fileInput}
          style={{ display: "none" }}
          id="imageSelector"
          type="file"
          onChange={fileSelectorHandler}
        />
        <div className="centerFlex">
          <Form noValidate validated={validated} onSubmit={handleSubmit} className="col-md-10 col-xl-10">
            <Form.Group>
              <Form.Label>Kategori</Form.Label>
              <Form.Control
                value={newNews.category}
                onChange={e => setNews({ ...newNews, category: e.target.value as CATEGORY })}
                as="select"
              >
                {Object.values(Const.Categories).map(c => (
                  <option key={c.key} value={c.key}>{c.value}</option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group>
              <Form.Label>Tip</Form.Label>
              <Form.Control
                value={newNews.type}
                onChange={e => setNews({ ...newNews, type: e.target.value as TYPE })}
                as="select"
              >
                <option value={TYPE.NEWS}>Manşet</option>
                <option value={TYPE.HEADLINE}>Alt Manşet</option>
                <option value={TYPE.SUB_NEWS}>Alt Haber</option>
              </Form.Control>
            </Form.Group>
            <Form.Group>
              <Form.Check
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setNews({
                    ...newNews,
                    isSecondPageNews: e.target.checked
                  })
                }
                checked={newNews.isSecondPageNews}
                type="checkbox"
                label="İkinci sayfa haberi"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Başlık</Form.Label>
              <Form.Control
                value={newNews.caption}
                required
                minLength={8}
                type="text"
                onChange={e => setNews({ ...newNews, caption: e.target.value })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Keywords</Form.Label>
              <Form.Control
                placeholder="haber, keyword, seo"
                value={newNews.keywords}
                onChange={e => setNews({ ...newNews, keywords: e.target.value })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Sosyal Tag</Form.Label>
              <Form.Control
                placeholder="facebooktag, gundem, twitterTag"
                value={newNews.socialTags}
                onChange={e => setNews({ ...newNews, socialTags: e.target.value })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Özet</Form.Label>
              <Form.Control
                required
                minLength={15}
                value={newNews.summary}
                onChange={e => setNews({ ...newNews, summary: e.target.value })}
                as="textarea"
                rows={2}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>İçerik</Form.Label>
              {editorLoaded ? (<CKEditor
                editor={ClassicEditor}
                data={newNews.content}
                onReady={editor => {
                  editor.plugins.get(
                    "FileRepository"
                  ).createUploadAdapter = loader => {
                    return new UploadAdapter(loader)
                  }
                }}
                onChange={(_e, editor) => {
                  setNews({ ...newNews, content: editor.getData() })
                }}
              />) : (
                <Form.Control
                  value={newNews.content}
                  onChange={e => setNews({ ...newNews, content: e.target.value })}
                  as="textarea"
                  rows={2}
                />
              )}
            </Form.Group>
            <Form.Group>
              <Form.Label>Durum</Form.Label>
              <Form.Control
                value={Number(newNews.isActive)}
                onChange={e => setNews({ ...newNews, isActive: e.target.value === "true" })}
                as="select"
              >
                <option value="true">Aktif</option>
                <option value="false">Pasif</option>
              </Form.Control>
            </Form.Group>
            <Button style={{ marginRight: 7 }} variant="primary" type="submit">
              {isUpdate ? "Güncelle" : "Ekle"}
            </Button>
            <Button style={{ marginRight: 7 }} variant="warning" onClick={() => Router.push('/adminpanel')}>
              Geri
            </Button>
            {isUpdate && (
              <Button
                variant="danger"
                onClick={() =>
                  API.deleteNews(newNews.id).then(() => {
                    Router.push("/adminpanel")
                  })
                }
              >
                Sil
              </Button>
            )}
            {errorMessages.length > 0 && (
              <Popup trigger={<button>Hata mesajları</button>} position="right center">
               <div>Hatalar..</div>
                {errorMessages.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
             </Popup>
            )}
          </Form>
        </div>
      </>}
      {session && !admins.includes(session.user.name) && <>
        {session.user.name} <br />
        Admin değilsiniz <br />
        Yazılımcıya ekran görüntüsü at seni eklesin.
      </>}
    </div>
  )
}

export default NewsEditor