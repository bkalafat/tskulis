import React, { FC } from 'react'
import { Button, Comment, Form, Header } from 'semantic-ui-react'
import { CommentType } from '../types/CommentType'

const CommentArea: FC<{ comments: CommentType[] }> = ({ comments }: { comments: CommentType[] }) => (
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
    <Form size='mini' reply>
      <Form.TextArea />
      <Button content='Yanıtla' labelPosition='left' icon='edit' primary  />
    </Form>
  </Comment.Group>

)

export default CommentArea