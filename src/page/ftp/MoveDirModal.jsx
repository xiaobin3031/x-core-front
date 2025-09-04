import {useEffect, useRef, useState} from "react";
import ajax from "../util/ajax.js";
import Modal from "../components/Modal.jsx";

export function MoveDirModal({sfiles, onOk, onClose}) {

  const foldByParentId = useRef({})
  const selectDirId = useRef(-1)
  const [dirs, setDirs] = useState([])

  useEffect(() => {
    let children = foldByParentId.current[0]
    if (!!children) {
      setDirs([[...children]])
    } else {
      ajax.get('/ftp/foldByParentId', {parentId: 0}).then(res => {
        setDirs([res])
      })
    }
  }, []);

  const close = (e) => {
    !!e && e.stopPropagation()
    onClose()
  }

  const moveFile = async (e) => {
    e.stopPropagation()
    const toMoveFiles = sfiles.filter(a => a.foldId !== selectDirId.current)
    if(toMoveFiles.length === 0) return
    await ajax.post('/ftp/moveFile', {files: toMoveFiles, foldId: selectDirId.current})
    onOk(selectDirId.current)
    close()
  }

  const showChildFold = async (e, index, dir) => {
    const list = dirs.slice(0, index + 1)
    list[index].forEach(a => a.active = dir.id === a.id)
    let children = foldByParentId.current[dir.id]
    selectDirId.current = dir.id
    if (!!children) {
      list.push(children)
      setDirs([...list])
    } else {
      let res = await ajax.get('/ftp/foldByParentId', {parentId: dir.id})
      foldByParentId.current[dir.id] = res
      list.push(res)
      setDirs([...list])
    }
  }

  function DirItemDiv({subDirs, parentIndex}) {

    return (
      <div className={'sub-dirs'}>
        {
          subDirs.map(subDir => {
            return (
              <div className={`sub-dir-item ${subDir.active ? 'active': ''}`}
                   key={`sub-dir-item-key-${subDir.id}`}
                   onClick={e => showChildFold(e, parentIndex, subDir)}
              >
                {subDir.name}
              </div>
            )
          })
        }
      </div>
    )
  }

  return (
    <Modal title={'移动目录'} onClose={close} onOk={moveFile}>
      {
        dirs.length > 0 &&
        dirs.filter(dir => dir.length > 0).map((dir, index) => {
          return <DirItemDiv key={`sub-dirs-${index}`} subDirs={dir} parentIndex={index}/>
        })
      }
    </Modal>
  )
}
