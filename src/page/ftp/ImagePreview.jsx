import ajax from "../util/ajax.js";
import {useEffect, useRef, useState} from "react";

export default function ImagePreview({file, onClose}) {

  const $imgBody = useRef(null)
  const $index = useRef(null)
  const loading = useRef(false)
  const stopped = useRef(false)
  const [imgs, setImgs] = useState([])

  useEffect(() => {
    initImage().then(() => {})

    const el = $imgBody.current;
    if (!el) return;

    const onScroll = async () => {
      if(loading.current) return
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
        loading.current = true
        // 滚动到底，加载下一张
        await nextImage()
        loading.current = false
      }else if (el.scrollTop <= 50) {
        loading.current = true;
        await prevImage()  // 或者调用 prevImage()
        loading.current = false;
      }
    };

    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const initImage = async () => {
    await loadImage()
    for (let i = 0; i < 3; i++) {
      await nextImage()
    }
  }

  const showImage = (res) => {
    if(!res || !res.img) return null
    const id = `img-preview-${res.sort === null ? res.fileId : res.sort}`
    res.id = id
    if(imgs.some(a => a.id === id)) return;
    imgs.push(res);
    if(imgs.length > 5) {
      imgs.splice(0, imgs.length - 5);
    }
    setImgs([...imgs])
    $index.current.innerText = res.sort === null ? res.fileId : (res.sort + 1)
  }

  const loadImage = async () => {
    let res = await ajax.post('/image-preview/show', {fileId: file.id})
    showImage(res)
  }

  const nextImage = async () => {
    if(stopped.current) return
    let res = await ajax.post('/image-preview/next', {})
    showImage(res)
  }

  const prevImage = async () => {
    let res = await ajax.post('/image-preview/prev', {})
    showImage(res)
  }

  const toggleStop = (e) => {
    stopped.current = !stopped.current
    if(stopped.current) {
      e.target.innerText = '继续'
    }else{
      e.target.innerText = '暂停'
    }
  }

  return (
    <div className={'image-preview'}>
      <div className='close-btn'>
        <button onClick={onClose} type='button'>关闭</button>
        <button style={{marginLeft: '10px'}} onClick={toggleStop} type='button'>暂停</button>
      </div>
      <div className='container'>
        <div className='image-body' ref={$imgBody}>
          {
            imgs.length > 0 && imgs.map(a => {
              return <div key={`image-preview-${a.id}`}>
                <img src={`data:${a.fileType};base64,${a.img}`}  alt='img'/>
              </div>
            })
          }
        </div>
      </div>
      <div className={'index'} ref={$index}>

      </div>
    </div>
  )
}