import { useState } from 'react'
import { CommentType } from '../types/CommentType'
import * as API from "../utils/api"


const CommentArea = ({ newsId, comments }: { newsId: string, comments: CommentType[] }) => {

  const minCommentLength = 30

  const [comment, setComment] = useState<CommentType>({
    text: '',
    id: '',
    newsId: newsId,
    userName: '',
    createDate: new Date().toISOString(),
    updateDate: new Date().toISOString(),
    isActive: true
  })
  const onSubmit = () => {
    API.insertComment(comment).then(() => {
      setComment({ ...comment, text: '', userName: '' })
    })
  }

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-center row">
        <div className="col-md-8">
          <div className="d-flex flex-column comment-section">
            {comments.map(c => {
              let [y, m, d, hh, mm, ss, ms] = c.createDate.match(/\d+/g)
              let date = new Date(Date.UTC(+y, +m - 1, +d, +hh, +mm, +ss, +ms))
              let formatted = date.toLocaleString()
              return <> <div className="bg-white p-2">
                <div className="d-flex flex-row user-info">
                  <div className="d-flex flex-column justify-content-start ml-2"><span className="d-block font-weight-bold name">{c.userName}</span><span className="date text-black-50">{formatted}</span></div>
                </div>
                <div className="mt-2">
                  <p className="comment-text">{c.text}</p>
                </div>
              </div></>
            })}
            <div className="bg-light p-2">
              <div className="d-flex flex-row align-items-start"><input placeholder="Kullanıcı Adı (en az 4 karakter)" onChange={e => setComment({ ...comment, userName: e.target.value })} value={comment.userName} className="form-control ml-1 shadow-none textarea"></input></div>
              <br />
              <div className="d-flex flex-row align-items-start"><textarea placeholder="Yorum (en az 30 karakter)" onChange={e => setComment({ ...comment, text: e.target.value })} value={comment.text} className="form-control ml-1 shadow-none textarea"></textarea></div>
              {comment.text.length < minCommentLength ? <div>{minCommentLength - comment.text.length} karakter kaldı.</div> : comment.userName.length > 3 ? <div>Uygun</div> : <div>Kullanıcı Adı giriniz.</div>}
              <div className="mt-2 text-right"><button onSubmit={onSubmit} disabled={comment.text.length <= minCommentLength || comment.userName.length < 4} className="btn btn-primary btn-sm shadow-none" type="button">Yorum yap</button></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommentArea