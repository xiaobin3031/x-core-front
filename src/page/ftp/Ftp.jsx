
import './ftp.css'
import ajax from "../util/ajax.js";
import {useEffect, useState, useRef} from "react";
import {AddIcon, FileIcon, FoldIcon, FileAddIcon, FoldAddIcon, MoreIcon} from '../components/Icon.jsx';
import Input from '../components/Input.jsx'
import {onEnter} from '../util/key.js'

export default function Ftp() {

  const [files, setFiles] = useState([])
  const [headInfo, setHeadInfo] = useState({
    path: ['文件夹1', '文件夹2']
  })
  const [uploadProgress, setUploadProgress] = useState({})
  const [addFoldFlag, setAddFoldFlag] = useState(false)
  const [clickedFile, setClickedFile] = useState(null)
  const [moreActionPos, setMoreActionPos] = useState(null)

  const newFileInputRef = useRef(null), foldInputRef = useRef(null), ftpContainerRef = useRef(null)

  useEffect(() => {
    ajax.get('/ftp/listDirs').then(res => {
      freshDirs(res.data)
    })
	  const list = []
    list.push({id:1, name :'上传的文件', isFile: true, uploading: true})
	  list.push({id:2, name: '测试文件夹'})
	  list.push({id: 3, name: '测试文件夹2'})
	  list.push({id: 4, name: '测试文件夹3'})
	  list.push({id: 5, name: '测试文件夹4'})
	  list.push({id: 6, name: '测试文件夹5'})
	  list.push({id: 7, name: '测试文件夹6'})
	  list.push({id: 8, name: '测试文件夹7'})
	  list.push({id: 9, name: '测试文件夹9'})
	  list.push({id: 10, name: '测试文件夹10'})
	  list.push({id: 11, name: '测试文件夹11'})
	  list.push({id: 12, name: '测试文件夹12'})
	  list.push({id: 13, name: '测试文件夹13'})
	  list.push({id: 14, name: '测试文件夹14'})
	  list.push({id: 15, name: '测试文件夹15'})
	  list.push({id: 16, isFile: true, name: '测试文件1'})
	  list.push({id: 17, isFile: true, name: '测试文件2'})
	  list.push({id: 18, isFile: true, name: '测试文件4'})
	  list.push({id: 19, isFile: true, name: '测试文件5'})
	  list.push({id: 20, isFile: true, name: '测试文件6'})
	  list.push({id: 21, isFile: true, name: '测试文件7'})
	  list.push({id: 22, isFile: true, name: '测试文件8'})
	  list.push({id: 23, isFile: true, name: '测试文件9'})
	  list.push({id: 24, isFile: true, name: '测试文件10'})
	  list.push({id: 25, isFile: true, name: '测试文件11'})
	  list.push({id: 26, isFile: true, name: '测试文件12'})
	  setFiles(list)
  }, []);

  const freshDirs = (data) => {
    setFiles(data.files)
    headInfo.path = data.path
    setHeadInfo({...headInfo})
  }

  const itemClick = (item) => {
    if(!!item.isFile){
      // file todo preview
    }else{
      // fold
      ajax.post('/ftp/changeDir', {dirName: item.name}).then(res => {
        freshDirs(res.data)
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
        freshDirs(res.data)
        setAddFoldFlag(false)
      })
    }else{
      setAddFoldFlag(false)
      e.target.value = ''
    }
  }

  
  const goToDir = (e) => {
    ajax.post('/ftp/changeDir', {name: e.target.innerText, direction: true}).then(res => {
      freshDirs(res.data)
    })
  }

  const clearFileClickInfo = () => {
      setClickedFile(null)
      setMoreActionPos(null)
  }

  const moreAction = (e, item) => {
    if(!!item.renameFlag) return

    if(!!clickedFile && item.id === clickedFile.id){
      clearFileClickInfo()
    }else{
      setClickedFile(item)
      const rect = e.target.getBoundingClientRect()
      setMoreActionPos({
        "top": (ftpContainerRef.current?.scrollTop + rect.top + e.target.clientHeight - 40).toFixed(0) + "px",
        "left": (rect.left - 10).toFixed(0) + 'px'
      })
    }
  }

  const deleteFile = () => {
    if(!clickedFile) return
    ajax.post('/ftp/removeFile', {id: clickedFile.id, fileFlag: !!clickedFile.isFile}).then(res => {
      setFiles(files.filter(a => a.id !== clickedFile.id))
      clearFileClickInfo()
    })
  }

  const renameFile = () => {
    if(!clickedFile) return
    clickedFile.renameFlag = true
    setFiles([...files])
    setMoreActionPos(null)
  }

  const moveFile = (dir) => {
    if(!clickedFile) return
    if(clickedFile.foldId === dir.id) return
    ajax.post('/ftp/moveFile', {fileId: clickedFile.id, foldId: dir.id}).then(res => {
      const list = dirs.filter(a => a.id !== clickedFile.id)
      setFiles([...list])
      clearFileClickInfo()
    })
  }

  const saveFileName = (e) => {
    const name = e.target.value.trim()
    if(!name) return
    if(clickedFile.name === name) {
      clickedFile.renameFlag = false
      clearFileClickInfo()
      setFiles([...files])
    }else {
      ajax.post('/ftp/rename', {id: clickedFile.id, newName: name}).then(res => {
        clickedFile.name = name
        clickedFile.renameFlag = false
        setFiles([...files])
        clearFileClickInfo()
      })
    }
  }

  function MoreActions({}) {

    const [showDirList, setShowDirList] = useState(false)
    const [dirs, setDirs] = useState(null)

    // 当前所指的文件夹名称
    const foldByParentId = useRef({
      0: [{id: 1, name: '测试1'}, {id: 2, name: '测试2'}],
      1: [{id: 3, name: '测试3'}, {id: 4, name: '测试4'}, {id: 9, name: '测试9'}, {id: 10, name: '测试10'}],
      2: [{id: 5, name: '测试5'}, {id: 6, name: '测试6'}],
      3: [{id: 7, name: '测试7'}, {id: 8, name: '测试8'}]
    })

    const showDir = () => {
      let children = foldByParentId.current[0]
      if(!!children){
        setDirs([[...children]])
      }else{
        ajax.get('/ftp/dirList', {parentId: 0}).then(res => {
          setShowDirList(true)
          setDirs([res.data])
        })
      }
    }

    const toMoveFile = (e, dir) => {
      setShowDirList(false)
      moveFile(dir)
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
          foldByParentId.current[dir.id] = res.data
          list.push(res.data)
          setDirs([...list])
        })
      }
    }

    return (
      <div className="more-actions" style={moreActionPos}>
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
            <a onClick={goToDir}>root</a>
            {
              !!headInfo.path && headInfo.path.length > 0 &&
                headInfo.path.map((p, i) => {
                  if(i == headInfo.path.length - 1){
                    return <span key={`head-path-${p}`}>{p}</span>
                  }else{
                    return <a onClick={goToDir} key={`head-path-${p}`}>{p}</a>
                  }
                })
            }
          </div>
          <div className="btns">
            <span onClick={() => newFileInputRef.current.click()}><FileAddIcon fill='green' /></span>
            <span onClick={() => setAddFoldFlag(true)} className="fold-add">
              {!addFoldFlag && <FoldAddIcon fill='green' />}
              {!!addFoldFlag && 
                  <div>
                    <Input onKeyDown={(e) => onEnter(e, foldNameChange)} label="文件夹名称" autoFocus={true} key="fold-add-key" onBlur={foldNameChange} />
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
                  <div className={`ftp-item file uploading`} key={`ftp-${index}-file-${file.name}`}>
                    <div className='info'>
                      {file.name}
                    </div>
                    <div className="sample"><Progress percent={uploadProgress[file.name]?.percent || 0}/></div>
                  </div>
                )
              }
              const type = !!file.isFile ? 'file': 'fold'
              return (
                <div className={`ftp-item ${type}`} key={`ftp-${index}-${type}-${file.name}`}>
                  <div className='info'>
                    {!file.renameFlag && <label>{file.name}</label> }
                    {!!file.renameFlag && 
                        <Input simple={true} defaultValue={file.name} placeholder={file.name} onKeyDown={e => onEnter(e, saveFileName)} onBlur={saveFileName} autoFocus={true}/>}
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
                  </div>
                </div>
              )
            })
          }
          {!!moreActionPos && <MoreActions />}
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
