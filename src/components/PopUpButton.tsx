import { Button, Modal } from 'semantic-ui-react'

const PopUpButton = ({ buttonName, header, content, isActive }: { buttonName: string, header: string, content: string, isActive: boolean }) => {
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
