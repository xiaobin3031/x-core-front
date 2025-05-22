
import './ftp.css'
import ajax from "../util/ajax.js";
import {useEffect, useState} from "react";
import {AddIcon, FileIcon, FoldIcon} from '../components/Icon.jsx';

export default function Ftp() {

  const [files, setFiles] = useState([])
  const [headInfo, setHeadInfo] = useState({})

  useEffect(() => {
	  // freshDirs()
	  const list = []
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

  function freshDirs() {
    ajax.get('/ftp/listDirs').then(files => {
      setFiles(files)
    })
  }

  function itemClick(item){

  }

  function addFile(){

  }

  return (
    <div className='ftp'>
      <div className='ftp-head'>
        <span className="path">{headInfo.path}</span>
      </div>
      <div className='ftp-container'>
        <div className='ftp-item add' onClick={addFile}>
          <AddIcon />
        </div>
        {
          files.map((file,index) => {
            const type = !!file.isFile ? 'file': 'fold'
            return (
            <div className={`ftp-item ${type}`} key={`ftp-${index}-${type}-${file.name}`}>
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
              <div className='info'>
                {file.name}
              </div>
            </div>
            )
          })
        }
      </div>
    </div>
  )
}
