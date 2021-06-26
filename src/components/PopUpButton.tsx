import { Button, Modal } from 'semantic-ui-react'

const PopUpButton = ({ buttonName, header, content, active }: { buttonName: string, header: string, content: string, active: boolean }) => {
  return (
    <Modal
      trigger={<Button active={active} disabled={!active} >{buttonName}</Button>}
      header={header}
      content={content}
      actions={[{ key: 'done', content: 'Tamam', positive: true }]}
    />
  )
}

export default PopUpButton
