import {useRef, useState} from "react";
import ajax from "../util/ajax.js";
import Modal from "../components/Modal.jsx";
import {FileUpload} from "../util/fileUpload.js";

export function AddFileModal({onOk, onClose}) {

    const newFoldInputRef = useRef(null)
    const newFileInputRef = useRef(null)
    const newDownloadInputRef = useRef(null)
    const xpathExpressRef = useRef(null)
    const downloadPlanUrlRef = useRef(null)
    const $progress = useRef(null)
    const selectedTab = useRef('0')
    const childCls = ['file-input', 'fold-input', 'download-input', 'download-plan-input']

    const [magnets, setMagnets] = useState([])

    const changeTab = (e) => {
      let showCls
      selectedTab.current = e.target.value
      if(selectedTab.current === '1') {
        showCls = 'file-input'
      }else if(selectedTab.current === '2') {
        showCls = 'fold-input'
      }else if(selectedTab.current === '3') {
        showCls = 'download-input'
      }else if(selectedTab.current === '4') {
        showCls = 'download-plan-input'
      }
      if(!!showCls) {
        const $dom = newFileInputRef.current.closest('.file-input-container')
        childCls.filter(a => a !== showCls).forEach(a => $dom.getElementsByClassName(a)[0].style.display = 'none')
        $dom.getElementsByClassName(showCls)[0].style.display = 'block'
      }
    }

    const uploadFile = async (e) => {
      e.stopPropagation()
      switch(selectedTab.current) {
        case '1': {  // add file
          let file = newFileInputRef.current.files[0]
          let fileUpload = new FileUpload(file, $progress.current)
          let res = await fileUpload.upload()
          if(res !== 0) {
            alert('上传失败')
            return
          }
          break
        }
        case '2': { // add fold

          break
        }
        case '3': { // add download
          const magnet = newDownloadInputRef.current.value
          if(!magnet) return
          await ajax.post('/ftp/addDownload', {magnet})
          break
        }
        case '4': {
          const url = downloadPlanUrlRef.current.value
          const xpath = xpathExpressRef.current.value
          if(!url || !xpath) return
          await ajax.post('/ftp/addDownloadPlan', {url, xpathExpression: xpath})
          break
        }
      }
      onOk(selectedTab.current)
    }

    const testDownloadPlan = async (e) => {
      e.stopPropagation()
      const url = downloadPlanUrlRef.current.value
      const xpath = xpathExpressRef.current.value
      if(!url || !xpath) return

      let html = await ajax.get('/ftp/loadHtmlText?url=' + url, {})
      if(!!html) {
        // 解析 HTML 字符串为 DOM
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // 运行 XPath 表达式
        const xpathResult = document.evaluate(xpath, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        let results = [];
        for (let i = 0; i < xpathResult.snapshotLength; i++) {
          results.push(xpathResult.snapshotItem(i).textContent.trim());
        }
        setMagnets([...results])
      }else{
        setMagnets([])
      }
    }

    const close = (e) => {
      !!e && e.stopPropagation()
      onClose()
    }

    return (
      <Modal title={'添加文件/文件夹'} onClose={close} onOk={uploadFile}>
        <div className={'add-file-modal'}>
          <div className='radios'>
            <label><input type={'radio'} name={'add-file-radio'} value="1" onChange={changeTab}/>新建文件</label>
            <label><input type={'radio'} name={'add-file-radio'} value="2" onChange={changeTab}/>新建文件夹</label>
            <label><input type={'radio'} name={'add-file-radio'} value="3" onChange={changeTab}/>新建下载任务</label>
            <label><input type={'radio'} name={'add-file-radio'} value="4" onChange={changeTab}/>新建下载计划</label>
          </div>
          <div className={'file-input-container'}>
            <div className={'file-input'}>
              <div>
                <input ref={newFileInputRef} type="file"/>
              </div>
              <div className={'progress'} ref={$progress}>
                <div className={'progress-bg'}></div>
                <div className={'progress-text'}>
                  <span className='current-chunk'>0</span>
                  <span style={{"marginLeft": '5px', "marginRight": '5px'}}>/</span>
                  <span className='total-chunk'>0</span>
                </div>
              </div>
            </div>
            <div className={'fold-input'}>
              <input type={'text'} ref={newFoldInputRef} placeholder={'输入文件夹名称'}/>
            </div>
            <div className={'download-input'}>
              <textarea ref={newDownloadInputRef} placeholder={'输入下载的磁力链接'}></textarea>
            </div>
            <div className={'download-plan-input'}>
              <div>
                <input ref={downloadPlanUrlRef} type={'text'} placeholder={'输入下载网址'} />
                <button type={'button'} onClick={testDownloadPlan}>测试</button>
              </div>
              <div>
                <textarea rows={3} ref={xpathExpressRef} placeholder={'请输入xpath表达式'}></textarea>
              </div>
              <div className={'magnet-list'}>
                {<div>total: {magnets.length}</div>}
                {
                  magnets.length > 0 && magnets.filter((_, index) => index < 3).map(a => {
                    return <div key={a}>{a}</div>
                  })
                }
              </div>
            </div>
          </div>
        </div>
      </Modal>
    )
  }
