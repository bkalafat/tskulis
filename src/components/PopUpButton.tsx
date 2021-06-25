import React, { FC } from 'react'
import { Button, Modal } from 'semantic-ui-react'

const PopUpButton: FC<{ buttonName: string, header: string, content: string, isActive: boolean }> = ({ buttonName, header, content, isActive }: { buttonName: string, header: string, content: string, isActive: boolean }) => {
  return (
    <Modal
      trigger={<Button active={isActive} >{buttonName}</Button>}
      header={header}
      content={content}
      actions={[{ key: 'done', content: 'Tamam', positive: true }]}
    />
  )
}

export default PopUpButton
