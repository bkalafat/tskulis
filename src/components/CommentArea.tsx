import { useState } from 'react'
import { Comment, Form, Header } from 'semantic-ui-react'
import { CommentType } from '../types/CommentType'
import * as API from "../utils/api"
import PopUpButton from './PopUpButton'
import 'semantic-ui-css/semantic.min.css'


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
    <Comment.Group className="maxWidth">
      <Header as='h3' dividing>
        Yorumlar
      </Header>
      {comments.map(c => {
        let [y, m, d, hh, mm, ss, ms] = c.createDate.match(/\d+/g)
        let date = new Date(Date.UTC(+y, +m - 1, +d, +hh, +mm, +ss, +ms))
        let formatted = date.toLocaleString()
        return <Comment key={c.id}>
          <Comment.Content>
            <Comment.Author as='a'>{c.userName}</Comment.Author>
            <Comment.Metadata>
              <div>{formatted}</div>
            </Comment.Metadata>
            <Comment.Text>{c.text}</Comment.Text>
          </Comment.Content>
        </Comment>
      })}
      <Form onSubmit={onSubmit} reply>
        <Form.Input placeholder="Kullanıcı Adı (en az 4 karakter)" onChange={e => setComment({ ...comment, userName: e.target.value })} value={comment.userName} />
        <Form.TextArea style={{ height: 60 }} placeholder="Yorum (en az 30 karakter)" onChange={e => setComment({ ...comment, text: e.target.value })} value={comment.text} />
        {comment.text.length < minCommentLength ? <div>{minCommentLength - comment.text.length} karakter kaldı.</div> : comment.userName.length > 3 ? <div>Uygun</div> : <div>Kullanıcı Adı giriniz.</div>}
        <PopUpButton buttonName="Yorum Yap" content='Onaya gönderildi.' header="Başarılı" active={comment.text.length >= minCommentLength && comment.userName.length > 3} />
      </Form>
    </Comment.Group>
  )
}

export default CommentArea