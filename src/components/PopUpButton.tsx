import React, { FC } from 'react'
import { Button, Modal } from 'semantic-ui-react'

const PopUpButton: FC<{ buttonName: string, header: string, content: string }> = ({ buttonName, header, content }: { buttonName: string, header: string, content: string }) => {
  return (
    <Modal
      trigger={<Button>{buttonName}</Button>}
      header={header}
      content={content}
      actions={[{ key: 'done', content: 'Tamam', positive: true }]}
    />
  )
}

export default PopUpButton
