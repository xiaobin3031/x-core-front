import {useRef, useState} from "react";
import ajax from "../util/ajax.js";
import Modal from "../components/Modal.jsx";

export function RenameAllModal({sfiles, onOk, onClose}) {
  const [list, setList] = useState(sfiles.map(a => {
    return {
      id: a.id,
      fileFlag: a.fileFlag,
      name: a.name,
      newName: a.name
    }
  }))

  const $find = useRef(null), $replace = useRef(null)

  const close = (e) => {
    !!e && e.stopPropagation()
    onClose()
  }

  const renameAll = async (e) => {
    e.stopPropagation()
    let updateList = list.filter(a => a.newName !== a.name).map(a => {
      return {
        id: a.id,
        fileFlag: a.fileFlag,
        newName: a.newName
      }
    })
    if(updateList.length > 0) {
      await ajax.post('/ftp/rename', updateList)
    }
    onOk(updateList)
    close()
  }

  const replace = () => {
    const findTxt = $find.current.value, replaceTxt = $replace.current.value
    if(!findTxt || !replaceTxt) return
    let reg = new RegExp(findTxt)
    list.filter(a => reg.test(a.name)).forEach(a => a.newName = a.name.replace(reg, replaceTxt))
    setList([...list])
  }

  const reduction = () => {
    list.forEach(a => a.newName = a.name)
    setList([...list])
  }

  return (
    <Modal title={'批量重命名'} onOk={renameAll} onClose={close}>
      <div className={'rename-all-container'}>
        <div className={'replace-regexp'}>
          <div className={'find'}>
            <input ref={$find} placeholder='请输入正则表达式'/>
            <button type={'button'} onClick={reduction}>Reduction</button>
          </div>
          <div className={'replace'}>
            <input ref={$replace} placeholder='请输入正则表达式'/>
            <button type={'button'} onClick={replace}>Replace</button>
          </div>
        </div>
        <div className={'replace-text'}>
          <table>
            <thead>
            <tr>
              <th>文件名称</th>
              <th>新文件名称</th>
            </tr>
            </thead>
            <tbody>
            {list.map((a, index) => (
              <tr key={`rename-file-${a.id}-${index}`}>
                <td>{a.name}</td>
                <td><textarea value={a.newName} onChange={e => {a.newName = e.target.value; setList([...list])}}></textarea></td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  )
}
