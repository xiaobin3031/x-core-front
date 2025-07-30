import './ftp.css'
import ajax from "../util/ajax.js";
import {useEffect, useRef, useState} from "react";
import {
  BackIcon,
  CheckAllIcon,
  FileAddIcon,
  FoldAddIcon,
  FoldIcon,
  MoreIcon,
  MoveIcon,
  RefreshIcon,
  TrashIcon, UnZipIcon
} from '../components/Icon.jsx';
import Input from '../components/Input.jsx'
import {onEnter} from '../util/key.js'
import VideoPlayer from './VideoPlayer.jsx'
import Modal from "../components/Modal.jsx";
import ScrollXText from "../components/ScrollXText.jsx";
import ImagePreview from "./ImagePreview.jsx";

export default function Ftp() {

  const [files, setFiles] = useState([])
  const [headInfo, setHeadInfo] = useState({})
  const [uploadProgress, setUploadProgress] = useState({})
  const [addFoldFlag, setAddFoldFlag] = useState(false)
  const [playVideo, setPlayVideo] = useState(false)
  const [showImage, setShowImage] = useState(false)
  const [fileTokens, setFileTokens] = useState({})
  const [modalFlags, setModalFlags] = useState({})
  const [clickedFile, setClickedFile] = useState(null)

  const selectFiles = useRef([])
  const allFiles = useRef([])

  const newFileInputRef = useRef(null), ftpContainerRef = useRef(null)

  useEffect(() => {
    freshRootDirs().then(() => {
    })
  }, []);

  const freshRootDirs = async () => {
    let res = await ajax.get("/ftp/listDirs")
    freshDirs(res)
    unSelectFile()
  }

  const unSelectFile = () => {
    selectFiles.current = []
    Array.from(document.querySelectorAll('input[name="file-checkbox"]')).forEach($a => $a.checked = false)
  }

  const backTo = async (e) => {
    e.stopPropagation()
    let res = await ajax.get("/ftp/goBack")
    freshDirs(res)
  }

  const freshDirs = (data) => {
    if (!data) {
      setFiles([])
      setHeadInfo({path: []})
      return
    }
    setFiles(data.files)
    headInfo.path = data.path
    setHeadInfo({...headInfo})
    allFiles.current = data.files
    document.querySelector('.files-searcher input').value = ''
  }

  const isVideo = (file) => {
    return !!file.fileType && file.fileType.indexOf("video/") === 0;
  }
  const isImage = (file) => {
    return !!file.fileType && file.fileType.indexOf("image/") === 0;
  }

  const itemClick = async (item) => {
    if (!!item.fileFlag) {
      if (isVideo(item)) {
        fileTokens.video = await ajax.post('/ftp/prepareFile', {id: item.id, prepareForPlay: true})
        setFileTokens({...fileTokens})
        setPlayVideo(true)
      }else if(isImage(item)) {
        setClickedFile( item)
        setShowImage(true)
      }
    } else {
      // fold
      let res = await ajax.post('/ftp/changeDir', {id: item.id})
      freshDirs(res)
      unSelectFile()
    }
  }

  const fileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      files.unshift({
        name: file.name,
        fileFlag: true,
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
        if (!!res) freshDirs(res);
      }, 100)
    }
  }

  const foldNameChange = async (e) => {
    const name = e.target.value
    if (!!name && !!name.trim()) {
      let res = await ajax.post('/ftp/addFold', {dirName: name})
      e.target.value = ""
      setAddFoldFlag(false)
      freshDirs(res)
    } else {
      setAddFoldFlag(false)
      e.target.value = ''
    }
  }


  const goToDir = async (id) => {
    let res = await ajax.post('/ftp/changeDir', {id: id, direction: true})
    freshDirs(res)
  }

  const moreAction = (e, item) => {
    e.stopPropagation()
    item.showMoreAction = !item.showMoreAction
    if (!!item.showMoreAction) {
      files.filter(a => a.id !== item.id).forEach(a => a.showMoreAction = false)
    }
    setFiles([...files]);
  }

  const closeAll = (e) => {
    e.stopPropagation()
    if(files.some(a => a.showMoreAction)){
      files.forEach(a => a.showMoreAction = false)
      setFiles([...files])
    }
  }

  function MoreActions({file}) {

    const showDir = async (e) => {
      e.stopPropagation()
      modalFlags.move = true;
      setModalFlags({...modalFlags})
      setClickedFile(file)
    }

    const deleteFile = async (e) => {
      e.stopPropagation()
      if (window.confirm("确定要删除吗？")) {
        let res = await ajax.post('/ftp/removeFile', {id: file.id, fileFlag: !!file.fileFlag})
        freshDirs(res)
      }
    }

    const renameFile = (e) => {
      e.stopPropagation()
      setClickedFile(file)
      modalFlags.rename = true
      setModalFlags({...modalFlags})
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
          <div onClick={showDir}>Move</div>
          <div onClick={downloadFile}>Download</div>
        </div>
      </div>
    )
  }

  function Samples({file}) {
    return (
      <>
        {
          !!file.fileFlag && <img width={'100%'} height={'100%'} src={`/file/sample/${file.id}.png`} alt=""/>
        }
        {
          !file.fileFlag && <FoldIcon/>
        }
      </>
    )
  }

  function MoveDirModal({sfiles}) {

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
      modalFlags.move = false
      modalFlags.moveBatch = false
      setModalFlags({...modalFlags})
    }

    const moveFile = async (e) => {
      e.stopPropagation()
      const toMoveFiles = sfiles.filter(a => a.foldId !== selectDirId.current)
      if(toMoveFiles.length === 0) return
      let res = await ajax.post('/ftp/moveFile', {files: toMoveFiles, foldId: selectDirId.current})
      freshDirs(res)
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

  function RenameModal({file}) {

    const [name, setName] = useState(file.name)

    const renameFile = async (e) => {
      e.stopPropagation()
      if (!name) return;
      let res = await ajax.post('/ftp/rename', {fileFlag: file.fileFlag, id: file.id, newName: name})
      freshDirs(res)
      close();
    }

    const close = (e) => {
      !!e && e.stopPropagation()
      modalFlags.rename = false
      setModalFlags({...modalFlags})
    }

    return (
      <Modal title={`重命名`} onClose={close} onOk={renameFile}>
        <input value={name} onChange={e => setName(e.target.value)}/>
      </Modal>
    )
  }

  const fileCheck = (e, file) => {
    if(e.target.checked) {
      selectFiles.current.push({id: file.id, fileFlag: file.fileFlag, name: file.name})
    }else {
      selectFiles.current = selectFiles.current.filter(a => a.id !== file.id)
    }
  }

  const batchMoveFile = (e) => {
    e.stopPropagation()
    if(selectFiles.current.length === 0) return

    modalFlags.moveBatch = true
    setModalFlags({...modalFlags})
  }

  const checkAllFile = (e) => {
    e.stopPropagation()
    Array.from(document.querySelectorAll('input[name="file-checkbox"]')).forEach($a => $a.checked = true)
    selectFiles.current = files.map(a => {
      return {
        id: a.id,
        fileFlag: a.fileFlag
      }
    })
  }

  const removeSelectFiles = async (e) => {
    e.stopPropagation()
    if(selectFiles.current.length === 0) return

    if(window.confirm('是否删除这些文件/文件夹')) {
      let res = await ajax.post('/ftp/removeFile', {files: selectFiles.current})
      unSelectFile()
      freshDirs(res)
    }
  }

  const unzipFiles = (e) => {
    e.stopPropagation()
    if(selectFiles.current.length === 0) return

    ajax.post('/ftp/unzipFile', selectFiles.current.map(a => a.id)).then(() => {})
  }

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("dragIndex", index);
  };

  const handleDrop = async (e, dropIndex) => {
    const dragIndex = parseInt(e.dataTransfer.getData("dragIndex"), 10);
    if (dragIndex === dropIndex) return;

    const updatedFiles = [...files];
    const [movedItem] = updatedFiles.splice(dragIndex, 1);
    updatedFiles.splice(dropIndex, 0, movedItem);

    // 重新设置 sort 字段
    updatedFiles.forEach((file, idx) => {
      file.sort = idx;
    });

    let res = await ajax.post('/ftp/sortFiles', updatedFiles.map((a, index) => ({id: a.id, fileFlag: a.fileFlag, sort: index})))
    freshDirs(res)
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // 必须阻止默认，才能触发 drop
  };

  const searchFiles = (e) => {
    e.stopPropagation()
    let value = e.target.value
    let list
    if(!!value) {
      list = allFiles.current.filter(a => a.name.indexOf(value) >= 0)
    }else{
      list = allFiles.current
    }
    setFiles([...list])
  }

  return (
    <>
      <div className='ftp' onClick={closeAll}>
        <div className='ftp-head'>
          <div className="path">
            {
              !!headInfo.path && headInfo.path.length > 0 &&
              headInfo.path.filter(a => !!a).map((p, i) => {
                if (i === headInfo.path.length - 1) {
                  return <span key={`head-path-${p}`}>{p}</span>
                } else {
                  return <a onClick={goToDir} key={`head-path-${p}`}>{p}</a>
                }
              })
            }
          </div>
          <div className="btns">
            <span onClick={backTo}><BackIcon/></span>
            <span onClick={freshRootDirs}><RefreshIcon fill='green'/></span>
            <span onClick={() => newFileInputRef.current.click()}><FileAddIcon fill='green'/></span>
            <span onClick={() => setAddFoldFlag(true)} className="fold-add">
              {!addFoldFlag && <FoldAddIcon fill='green'/>}
              {!!addFoldFlag &&
                <div>
                  <Input onKeyDown={(e) => onEnter(e, foldNameChange)} label="文件夹名称" autoFocus={true}
                         key="fold-add-key"/>
                </div>
              }
            </span>
            <input type="file" hidden={true} ref={newFileInputRef} onChange={fileChange}/>
            <span onClick={e => batchMoveFile(e)}> <MoveIcon fill="green"/> </span>
            <span onClick={e => checkAllFile(e)}> <CheckAllIcon /> </span>
            <span onClick={e => removeSelectFiles(e)}> <TrashIcon /> </span>
            <span onClick={e => unzipFiles(e)}> <UnZipIcon /></span>
            <span className='files-searcher'>
              <input name='search-files' onKeyDown={e => onEnter(e, searchFiles)}/>
            </span>
          </div>
        </div>
        <div className='ftp-container' ref={ftpContainerRef}>
          {
            files.map((file, index) => {
              if (!!file.uploading) {
                return (
                  <div className={`ftp-item file uploading`} key={`ftp-file-${file.name}`}>
                    <div className='info' title={file.name}>
                      {file.name}
                    </div>
                    <div className="sample"><Progress percent={uploadProgress[file.name]?.percent || 0}/></div>
                  </div>
                )
              }
              const type = !!file.fileFlag ? 'file' : 'fold'
              return (
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragOver={handleDragOver}
                  className={`ftp-item ${type}`} key={`ftp-${type}-${file.name}`}>
                  <div className='info'>
                    <div className='name'>
                      <label>
                        <input name="file-checkbox" type="checkbox" onClick={e => fileCheck(e, file)}/>
                        <ScrollXText text={file.name} />
                      </label>
                    </div>
                    <span className='icon' onClick={(e) => moreAction(e, file)}><MoreIcon/></span>
                  </div>
                  <div className='sample' onClick={() => itemClick(file)}>
                    <Samples file={file} />
                    {!!file.showMoreAction && <MoreActions file={file}/>}
                  </div>
                </div>
              )
            })
          }
        </div>
        {!!playVideo && <VideoPlayer fileToken={fileTokens['video']} closePlayer={() => setPlayVideo(false)}/>}
        {!!showImage && <ImagePreview file={clickedFile} onClose={() => setShowImage(false)}/>}
      </div>
      {!!modalFlags.rename && <RenameModal file={clickedFile}/>}
      {!!modalFlags.move && <MoveDirModal sfiles={[clickedFile]} /> }
      {!!modalFlags.moveBatch && <MoveDirModal sfiles={selectFiles.current} /> }
    </>
  )
}

function Progress({percent}) {

  return (
    <div className="file-upload-progress" style={{'--progress': `${percent}`}}>
      <div className='overlay'>
        <div className='progress-bg' data-left={`${100 - percent}%`}></div>
      </div>
    </div>
  )
}
