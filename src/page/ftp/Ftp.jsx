import './ftp.css'
import ajax from "../util/ajax.js";
import { useEffect, useRef, useState} from "react";
import {
  BackIcon,
  CheckAllIcon,
  FileAddIcon,
  FoldAddIcon,
  FoldIcon, ModifyIcon,
  MoreIcon,
  MoveIcon,
  RefreshIcon, SortIcon,
  TrashIcon, UnZipIcon
} from '../components/Icon.jsx';
import Input from '../components/Input.jsx'
import {onEnter} from '../util/key.js'
import VideoPlayer from './VideoPlayer.jsx'
import ScrollXText from "../components/ScrollXText.jsx";
import ImagePreview from "./ImagePreview.jsx";
import {RenameAllModal} from "./RenameModal.jsx";
import {AddFileModal} from "./AddFileModal.jsx";
import {MoveDirModal} from "./MoveDirModal.jsx";

export default function Ftp(start) {

  const [files, setFiles] = useState([])
  const [headInfo, setHeadInfo] = useState({})
  const [addFoldFlag, setAddFoldFlag] = useState(false)
  const [playVideo, setPlayVideo] = useState(false)
  const [showImage, setShowImage] = useState(false)
  const [fileTokens, setFileTokens] = useState({})
  const [modalFlags, setModalFlags] = useState({})
  const [clickedFile, setClickedFile] = useState(null)

  const selectFiles = useRef([])
  const allFiles = useRef([])

  const ftpContainerRef = useRef(null)

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
    unSelectFile()
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
  const isPdf = (file) => {
    return !!file.fileType && file.fileType === 'application/pdf';
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
      }else if(isPdf(item)) {
        let res = await ajax.post('/ftp/prepareFile', {id: item.id, prepareForPlay: true})
        window.open(`${ajax.getBaseUrl()}/ftp/previewPdf/${res}`)
      }
    } else {
      // fold
      let res = await ajax.post('/ftp/changeDir', {id: item.id})
      freshDirs(res)
      unSelectFile()
      if(!!res.lastFile) {
        if(window.confirm('有观看历史，是否进入?')) {
          await itemClick(res.lastFile)
        }
      }
    }
  }

  const foldNameChange = async (e) => {
    const name = e.target.value
    if (!!name && !!name.trim()) {
      let foldId = await ajax.post('/ftp/addFold', {dirName: name})
      e.target.value = ""
      setAddFoldFlag(false)
      if(!!foldId) {
        const fold = {id: foldId, fileFlag: false, name}
        let idx = -1;
        for (let i = 0; i < files.length; i++) {
          if(files[i].fileFlag) {
            idx = i
            break
          }
        }
        if(idx === -1) {
          files.push(fold);
        }else{
          files.splice(idx, 0, fold);
        }
        setFiles([...files])
      }
    } else {
      setAddFoldFlag(false)
      e.target.value = ''
    }
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

  function Samples({file}) {
    return (
      <>
        {
          !!file.fileFlag && <img loading='lazy' width={'100%'} height={'100%'} src={`/file/sample/${file.id}.png`} alt=""/>
        }
        {
          !file.fileFlag && <FoldIcon/>
        }
      </>
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
    const $doms = Array.from(document.querySelectorAll('input[name="file-checkbox"]'))
    if($doms.some($a => !$a.checked)) {
      $doms.forEach($a => $a.checked = true)
      selectFiles.current = files.map(a => {
        return {
          id: a.id,
          fileFlag: a.fileFlag,
          name: a.name
        }
      })
    }else{
      unSelectFile()
    }
  }

  const removeSelectFiles = async (e) => {
    e.stopPropagation()
    if(selectFiles.current.length === 0) return

    if(window.confirm('是否删除这些文件/文件夹')) {
      await ajax.post('/ftp/removeFile', {files: selectFiles.current})
      const newList = files.filter(a => !selectFiles.current.some(b => b.id === a.id))
      unSelectFile()
      setFiles(newList)
    }
  }

  const unzipFiles = async (e) => {
    e.stopPropagation()
    if(selectFiles.current.length === 0) return

    if(window.confirm('是否解压所选文件？')) {
      await ajax.post('/ftp/unzipFile', selectFiles.current.map(a => a.id))
      unSelectFile()
    }
  }

  const renameFiles = (e) => {
    e.stopPropagation()
    if(selectFiles.current.length === 0) return

    modalFlags.renameAll = true
    setModalFlags({...modalFlags})
  }

  const sortFilesInFold = async (e) => {
    e.stopPropagation()
    // 按名称升序排序
    let res = await ajax.post('/ftp/sortFilesByNameAsc', {})
    freshDirs(res)
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

    await ajax.post('/ftp/sortFiles', updatedFiles.map((a, index) => ({id: a.id, fileFlag: a.fileFlag, sort: index})))
    setFiles([...updatedFiles])
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

  const renameAllOk = (list) => {
    if(!!list && list.length > 0) {
      files.forEach(a => {
        const sf = list.filter(b => a.id === b.id)[0]
        if(!sf) {
          a.name = sf.name
        }
      })
      setFiles([...files])
    }
  }

  const renameAllClose = () => {
    modalFlags.renameAll = false
    setModalFlags({...modalFlags})
    unSelectFile()
  }

  const addFileClose = () => {
    modalFlags.fileAdd = false
    setModalFlags({...modalFlags})
  }
  const addFileOk = async (tab) => {
    if(tab === '1' || tab === '2') {
      await freshRootDirs()
    }
  }

  const moveDirOk = async (foldId) => {
    const list = files.filter(a => a.foldId !== foldId)
    setFiles([...list])
  }
  const moveDirClose = () => {
    modalFlags.moveBatch = false
    setModalFlags({...modalFlags})
  }

  return (
    <>
      <div className='ftp' onClick={closeAll}>
        <div className='ftp-head'>
          <div className="btns">
            <span onClick={backTo}><BackIcon/></span>
            <span onClick={freshRootDirs}><RefreshIcon fill='green'/></span>
            <span onClick={() => {modalFlags.fileAdd = true;setModalFlags({...modalFlags})}}><FileAddIcon fill='green'/></span>
            <span onClick={() => setAddFoldFlag(true)} className="fold-add">
              {!addFoldFlag && <FoldAddIcon fill='green'/>}
              {!!addFoldFlag &&
                <div>
                  <Input onKeyDown={(e) => onEnter(e, foldNameChange)} label="文件夹名称" autoFocus={true}
                         key="fold-add-key"/>
                </div>
              }
            </span>
            <span onClick={e => batchMoveFile(e)}> <MoveIcon fill="green"/> </span>
            <span onClick={e => checkAllFile(e)}> <CheckAllIcon /> </span>
            <span onClick={e => removeSelectFiles(e)}> <TrashIcon /> </span>
            <span onClick={e => unzipFiles(e)}> <UnZipIcon /></span>
            <span onClick={e => renameFiles(e)}> <ModifyIcon /></span>
            <span onClick={e => sortFilesInFold(e)}> <SortIcon/></span>
            <span className='files-searcher'>
              <input name='search-files' onKeyDown={e => onEnter(e, searchFiles)}/>
            </span>
          </div>
          <div className="path">
            {
              !!headInfo.path && headInfo.path.length > 0 && headInfo.path[headInfo.path.length - 1]
            }
          </div>
        </div>
        <div className='ftp-container' ref={ftpContainerRef}>
          {
            files.map((file, index) => {
              const type = !!file.fileFlag ? 'file' : 'fold'
              return (
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragOver={handleDragOver}
                  className={`ftp-item ${type}`} key={`ftp-${index}-${type}-${file.name}`}>
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
                  </div>
                </div>
              )
            })
          }
        </div>
        {!!playVideo && <VideoPlayer fileToken={fileTokens['video']} closePlayer={() => setPlayVideo(false)}/>}
        {!!showImage && <ImagePreview file={clickedFile} onClose={() => setShowImage(false)}/>}
      </div>
      {!!modalFlags.moveBatch && <MoveDirModal sfiles={selectFiles.current} onOk={moveDirOk} onClose={moveDirClose} /> }
      {!!modalFlags.fileAdd && <AddFileModal onOk={addFileOk} onClose={addFileClose}/>}
      {!!modalFlags.renameAll && <RenameAllModal sfiles={selectFiles.current} onOk={renameAllOk} onClose={renameAllClose}/>}
    </>
  )
}