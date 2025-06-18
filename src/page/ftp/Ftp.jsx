
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

  const freshRootDirs = async () => {
    let res = await ajax.get("/ftp/listDirs")
    freshDirs(res)
  }

  const backTo = async () => {
    let res = await ajax.get("/ftp/goBack")
    freshDirs(res)
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

  const itemClick = async (item) => {
    if(!!item.fileFlag){
      // file todo preview
    }else{
      // fold
      let res = await ajax.post('/ftp/changeDir', {id: item.id})
      freshDirs(res)
    }
  }

  const fileChange = async (e) => {
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
      setTimeout(async () => {
        let res = await ajax.uploadFile('/ftp/uploadFile', file, ({percent}) => {
          uploadProgress[file.name].progress = percent
          setUploadProgress({...uploadProgress})
        })
        if(!!res) freshDirs(res);
      }, 100)
    }
  }

  const foldNameChange = async (e) => {
    const name = e.target.value
    if(!!name && !!name.trim()){
      let res = await ajax.post('/ftp/addFold', {dirName: name})
      e.target.value = ""
      setAddFoldFlag(false)
      freshDirs(res)
    }else{
      setAddFoldFlag(false)
      e.target.value = ''
    }
  }

  
  const goToDir = async (id) => {
    let res = await ajax.post('/ftp/changeDir', {id: id, direction: true})
    freshDirs(res)
  }

  const moreAction = (e, item) => {
    if(!!item.renameFlag) return

    item.showMoreAction = !item.showMoreAction
    if(!!item.showMoreAction){
      files.filter(a => a.id !== item.id).forEach(a => a.showMoreAction = false)
    }
    setFiles([...files]);
  }

  const saveFileName = async (e, file) => {
    const name = e.target.value.trim()
    if(!name) return
    if(file.name === name) {
      file.renameFlag = false
      setFiles([...files])
    }else {
      let res = await ajax.post('/ftp/rename', {fileFlag: file.fileFlag, id: file.id, newName: name})
      freshDirs(res)
    }
  }

  function MoreActions({file}) {

    const [dirs, setDirs] = useState(null)

    // 当前所指的文件夹名称
    const foldByParentId = useRef({})

    const showDir = async (e) => {
      e.stopPropagation()
      let children = foldByParentId.current[0]
      if(!!children){
        setDirs([[...children]])
      }else{
        let res = await ajax.get('/ftp/foldByParentId', {parentId: 0})
        setDirs([res])
      }
    }

    const toMoveFile = async (e, dir) => {
      e.stopPropagation()
      await moveFile(dir)
    }

    const moveFile = async (dir) => {
      if(file.foldId === dir.id) return
      let res = await ajax.post('/ftp/moveFile', {id: file.id, foldId: dir.id})
      freshDirs(res)
    }

    const showChildFold = async (e, index, dir) => {
      const list = dirs.slice(0, index+1)
      list[index].forEach(a => a.active = dir.id === a.id)
      let children = foldByParentId.current[dir.id]
      if(!!children){
        list.push(children)
        setDirs([...list])
      }else{
        let res = await ajax.get('/ftp/foldByParentId', {parentId: dir.id})
        foldByParentId.current[dir.id] = res
        list.push(res)
        setDirs([...list])
      }
    }

    const deleteFile = async (e) => {
      e.stopPropagation()
      let res = await ajax.post('/ftp/removeFile', {id: file.id, fileFlag: !!file.isFile})
      freshDirs(res)
    }

    const renameFile = (e) => {
      e.stopPropagation()
      file.renameFlag = true
      file.showMoreAction = false
      setFiles([...files])
    }

    const downloadFile = async (e) => {
      e.stopPropagation()
      let res = await ajax.post('/ftp/prepareFile', {id: file.id})
      ajax.downloadFile("/ftp/downloadFile?fileToken=" + res)
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
          <div onClick={downloadFile}>Download</div>
        </div>
        {!!dirs && dirs.length > 0 && 
          <div className="dirs-container">
            {
                dirs.filter(folds => !!folds && folds.length > 0).map((folds, j) => {
                  return (
                    <div>
                      <ul className="dir-list">
                        {
                          folds.filter(dir => dir.id !== file.foldId).map((dir, i) => {
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
            files.map(file => {
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
                    !!file.sample && <img src={file.sample}  alt=""/>
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
