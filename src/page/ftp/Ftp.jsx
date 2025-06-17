
import './ftp.css'
import ajax from "../util/ajax.js";
import {useEffect, useState, useRef} from "react";
import {FileIcon, FoldIcon, FileAddIcon, FoldAddIcon, MoreIcon, RefreshIcon, BackIcon} from '../components/Icon.jsx';
import Input from '../components/Input.jsx'
import {onEnter} from '../util/key.js'

export default function Ftp() {

  const [files, setFiles] = useState([])
  const [headInfo, setHeadInfo] = useState({})
  const [uploadProgress, setUploadProgress] = useState({})
  const [addFoldFlag, setAddFoldFlag] = useState(false)

  const newFileInputRef = useRef(null), ftpContainerRef = useRef(null)

  useEffect(() => {
    freshRootDirs()
  }, []);

  const freshRootDirs = () => {
    ajax.get("/ftp/listDirs").then(res => {
      freshDirs(res)
    })
  }

  const backTo = () => {
    ajax.get("/ftp/goBack").then(res => {
      freshDirs(res)
    })
  }

  const freshDirs = (data) => {
    if(!data) {
      setFiles([])
      setHeadInfo({path: []})
      return
    }
    setFiles(data.files)
    headInfo.path = data.path
    setHeadInfo({...headInfo})
  }

  const itemClick = (item) => {
    if(!!item.isFile){
      // file todo preview
    }else{
      // fold
      ajax.post('/ftp/changeDir', {id: item.id}).then(res => {
        freshDirs(res)
      })
    }
  }

  const fileChange = (e) => {
    const file = e.target.files[0]
    if(file) {
      files.unshift({
        name: file.name,
        isFile: true,
        uploading: true
      })
      uploadProgress[file.name] = {
        size: file.size,
        progress: 0
      }
      setUploadProgress({...uploadProgress})
      setTimeout(() => {
        ajax.uploadFile('/ftp/uploadFile', file, ({percent}) => {
          uploadProgress[file.name].progress = percent
          setUploadProgress({...uploadProgress})
        }).then(res => {
          // todo upload success
        })
      })
    }
  }

  const foldNameChange = (e) => {
    const name = e.target.value
    if(!!name && !!name.trim()){
      ajax.post('/ftp/addFold', {dirName: name}).then(res => {
        e.target.value = ""
        setAddFoldFlag(false)
        freshDirs(res)
      })
    }else{
      setAddFoldFlag(false)
      e.target.value = ''
    }
  }

  
  const goToDir = (id) => {
    ajax.post('/ftp/changeDir', {id: id, direction: true}).then(res => {
      freshDirs(res)
    })
  }

  const moreAction = (e, item) => {
    if(!!item.renameFlag) return

    item.showMoreAction = !item.showMoreAction
    if(!!item.showMoreAction){
      files.filter(a => a.id !== item.id).forEach(a => a.showMoreAction = false)
    }
    setFiles([...files]);
  }

  const saveFileName = (e, file) => {
    const name = e.target.value.trim()
    if(!name) return
    if(file.name === name) {
      file.renameFlag = false
      setFiles([...files])
    }else {
      ajax.post('/ftp/rename', {fileFlag: file.fileFlag, id: file.id, newName: name}).then(res => {
        freshDirs(res)
      })
    }
  }

  function MoreActions({file}) {

    const [showDirList, setShowDirList] = useState(false)
    const [dirs, setDirs] = useState(null)

    // 当前所指的文件夹名称
    const foldByParentId = useRef({})

    const showDir = () => {
      let children = foldByParentId.current[0]
      if(!!children){
        setDirs([[...children]])
      }else{
        ajax.get('/ftp/dirList', {parentId: 0}).then(res => {
          setShowDirList(true)
          setDirs([res])
        })
      }
    }

    const toMoveFile = (e, dir) => {
      setShowDirList(false)
      moveFile(dir)
    }

    const moveFile = (dir) => {
      if(file.foldId === dir.id) return
      ajax.post('/ftp/moveFile', {fileId: file.id, foldId: dir.id}).then(() => {
        const list = files.filter(a => a.id !== file.id)
        setFiles([...list])
      })
    }

    const showChildFold = (e, index, dir) => {
      const list = dirs.slice(0, index+1)
      list[index].forEach(a => a.active = dir.id === a.id)
      let children = foldByParentId.current[dir.id]
      if(!!children){
        list.push(children)
        setDirs([...list])
      }else{
        ajax.get('/ftp/foldByParentId', {parentId: dir.id}).then(res => {
          foldByParentId.current[dir.id] = res
          list.push(res)
          setDirs([...list])
        })
      }
    }

    const deleteFile = () => {
      ajax.post('/ftp/removeFile', {id: file.id, fileFlag: !!file.isFile}).then(() => {
        setFiles(files.filter(a => a.id !== file.id))
      })
    }

    const renameFile = (e) => {
      e.stopPropagation()
      file.renameFlag = true
      file.showMoreAction = false
      setFiles([...files])
    }

    return (
      <div className="more-actions">
        <div className="action-list">
          <div onClick={deleteFile}>Delete</div>
          <div onClick={renameFile}>Rename</div>
          <div onClick={showDir}>
            <div>Move</div>
          </div>
        </div>
        {!!dirs && dirs.length > 0 && 
          <div className="dirs-container">
            {
                dirs.map((folds, j) => {
                  return (
                    <div>
                      <ul className="dir-list">
                        {
                          folds.map((dir, i) => {
                            return <li className={`${!!dir.active ? 'active' : ''}`} key={`dir-li-${dir.id}-${i}`} onClick={e => toMoveFile(e, dir)} onMouseOver={e => showChildFold(e, j, dir)}>{dir.name}</li>
                          })
                        }
                      </ul>
                    </div>
                  )
                })
            }
          </div>
        }
      </div>
    )
  }

  return (
    <>
      <div className='ftp'>
        <div className='ftp-head'>
          <div className="path">
            {
              !!headInfo.path && headInfo.path.length > 0 &&
                headInfo.path.filter(a => !!a).map((p, i) => {
                  if(i === headInfo.path.length - 1){
                    return <span key={`head-path-${p}`}>{p}</span>
                  }else{
                    return <a onClick={goToDir} key={`head-path-${p}`}>{p}</a>
                  }
                })
            }
          </div>
          <div className="btns">
            <span onClick={backTo}><BackIcon /></span>
            <span onClick={freshRootDirs}><RefreshIcon fill='green'/></span>
            <span onClick={() => newFileInputRef.current.click()}><FileAddIcon fill='green' /></span>
            <span onClick={() => setAddFoldFlag(true)} className="fold-add">
              {!addFoldFlag && <FoldAddIcon fill='green' />}
              {!!addFoldFlag && 
                  <div>
                    <Input onKeyDown={(e) => onEnter(e, foldNameChange)} label="文件夹名称" autoFocus={true} key="fold-add-key" />
                  </div>
              }
            </span>
            <input type="file" hidden={true} ref={newFileInputRef} onChange={fileChange}/>
          </div>
        </div>
        <div className='ftp-container' ref={ftpContainerRef}>
          {
            files.map((file,index) => {
              if(!!file.uploading) {
                return (
                  <div className={`ftp-item file uploading`} key={`ftp-file-${file.name}`}>
                    <div className='info'>
                      {file.name}
                    </div>
                    <div className="sample"><Progress percent={uploadProgress[file.name]?.percent || 0}/></div>
                  </div>
                )
              }
              const type = !!file.isFile ? 'file': 'fold'
              return (
                <div className={`ftp-item ${type}`} key={`ftp-${type}-${file.name}`}>
                  <div className='info'>
                    {!file.renameFlag && <label>{file.name}</label> }
                    {!!file.renameFlag && 
                        <Input simple={true} defaultValue={file.name} placeholder={file.name} onKeyDown={e => onEnter(e, () => saveFileName(e, file))} autoFocus={true}/>}
                    <span onClick={(e) => moreAction(e, file)}><MoreIcon /></span>
                  </div>
                  <div className='sample' onClick={() => itemClick(file)}>
                  {
                    !!file.sample && <img src={file.sample} />
                  }
                  {
                    !file.sample && !!file.isFile && <FileIcon />
                  }
                  {
                    !file.sample && !file.isFile && <FoldIcon />
                  }
                    {!!file.showMoreAction && <MoreActions file={file} /> }
                  </div>
                </div>
              )
            })
          }
        </div>
      </div>
    </>
  )
}

function Progress({percent}){
  
  return (
    <div className="file-upload-progress" style={{'--progress': `${percent}`}}>
      <div className='overlay'>
        <div className='progress-bg' data-left={`${100 - percent}%`}></div>
      </div>
    </div>
  )
}
