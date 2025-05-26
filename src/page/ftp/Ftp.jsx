
import './ftp.css'
import ajax from "../util/ajax.js";
import {useEffect, useState, useRef} from "react";
import {AddIcon, FileIcon, FoldIcon, FileAddIcon, FoldAddIcon} from '../components/Icon.jsx';

export default function Ftp() {

  const [files, setFiles] = useState([])
  const [headInfo, setHeadInfo] = useState({
    path: ['文件夹1', '文件夹2']
  })
  const [uploadProgress, setUploadProgress] = useState({})

  const newFileInputRef = useRef(null)

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

  function freshDirs(data) {
    setFiles(data.files)
    headInfo.path = data.path
    setHeadInfo({...headInfo})
  }

  function itemClick(item){
    if(!!item.isFile){
      // file todo preview
    }else{
      // fold
      ajax.post('/ftp/changeDir', {name: item.name}).then(res => {
        freshDirs(res.data)
      })
    }
  }

  function addFile(){
    newFileInputRef.current.click()
  }

  function fileChange(e){
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

  function addFold() {

  }

  function goToDir(e){
    ajax.post('/ftp/changeDir', {name: e.target.innerText, direction: true}).then(res => {
      freshDirs(res.data)
    })
  }

  return (
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
          <span onClick={addFile}><FileAddIcon width={20} height={20} fill='green' /></span>
          <span onClick={addFold}><FoldAddIcon width={20} height={20} fill='green' /></span>
          <input type="file" hidden="true" ref={newFileInputRef} onChange={fileChange}/>
        </div>
      </div>
      <div className='ftp-container'>
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
                  {file.name}
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
      </div>
    </div>
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
