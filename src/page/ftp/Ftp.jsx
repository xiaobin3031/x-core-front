
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
    list.push({name :'上传的文件', isFile: true, uploading: true})
	  list.push({name: '测试文件夹'})
	  list.push({name: '测试文件夹2'})
	  list.push({name: '测试文件夹3'})
	  list.push({name: '测试文件夹4'})
	  list.push({name: '测试文件夹5'})
	  list.push({name: '测试文件夹6'})
	  list.push({name: '测试文件夹7'})
	  list.push({name: '测试文件夹9'})
	  list.push({name: '测试文件夹10'})
	  list.push({name: '测试文件夹11'})
	  list.push({name: '测试文件夹12'})
	  list.push({name: '测试文件夹13'})
	  list.push({name: '测试文件夹14'})
	  list.push({name: '测试文件夹15'})
	  list.push({isFile: true, name: '测试文件1'})
	  list.push({isFile: true, name: '测试文件2'})
	  list.push({isFile: true, name: '测试文件4'})
	  list.push({isFile: true, name: '测试文件5'})
	  list.push({isFile: true, name: '测试文件6'})
	  list.push({isFile: true, name: '测试文件7'})
	  list.push({isFile: true, name: '测试文件8'})
	  list.push({isFile: true, name: '测试文件9'})
	  list.push({isFile: true, name: '测试文件10'})
	  list.push({isFile: true, name: '测试文件11'})
	  list.push({isFile: true, name: '测试文件12'})
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
      ajax.post('/ftp/changeDir', {name: item.name}).then(res => {
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
        }, 2000)
      })
    }
  }

  const foldNameChange = (e) => {
    onEnter(e, () => {
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
    })
  }

  
  const goToDir = (e) => {
    ajax.post('/ftp/changeDir', {name: e.target.innerText, direction: true}).then(res => {
      freshDirs(res.data)
    })
  }

  const moreAction = (e, item) => {
    setClickedFile(item)
    const rect = e.target.getBoundingClientRect()
    console.log('scrollTop', ftpContainerRef.current?.scrollTop, 'top', rect.top, 'e', e)
    setMoreActionPos({
      "top": (ftpContainerRef.current?.scrollTop + rect.top + e.target.clientHeight - 40).toFixed(0) + "px",
      "left": (rect.left - 10).toFixed(0) + 'px'
    })
  }

  const deleteFile = () => {
    ajax.post('/ftp/removeFile', {id: clickedFile.id}).then(res => {
      setFiles(files.filter(a => a.id !== clickedFile.id))
    })
  }

  const renameFile = () => {

  }

  const moveFile = () => {

  }

  function MoreActions({}) {

    return (
      <div className="more-actions" style={moreActionPos}>
        <div onClick={deleteFile}>Delete</div>
        <div onClick={renameFile}>Rename</div>
        <div onClick={moveFile}>Move</div>
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
                    <Input onKeyDown={foldNameChange} label="文件夹名称" autoFocus={true} key="fold-add-key" />
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
                    <label>{file.name}</label>
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
