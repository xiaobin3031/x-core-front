import ajax from "../util/ajax.js";
import {useEffect, useRef, useState} from "react";

export default function ImagePreview({file, onClose}) {

  const $imgBody = useRef(null)
  const [imgs, setImgs] = useState([])

  useEffect(() => {
    loadImage().then(() => {})
  }, []);

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
  }

  const loadImage = async () => {
    let res = await ajax.post('/image-preview/show', {fileId: file.id})
    showImage(res)
  }

  const nextImage = async () => {
    let res = await ajax.post('/image-preview/next', {})
    showImage(res)
  }

  const prevImage = async () => {
    let res = await ajax.post('/image-preview/prev', {})
    showImage(res)
  }

  return (
    <div className={'image-preview'}>
      <div className='close-btn'>
        <button onClick={onClose} type='button'>关闭</button>
      </div>
      <div className='container'>
        <span className={'prev-image'} onClick={prevImage}></span>
        <div className='image-body' ref={$imgBody}>
          {
            imgs.length > 0 && imgs.map(a => {
              return <div key={`image-preview-${a.id}`}>
                <img src={`data:${a.fileType};base64,${a.img}`}  alt='img'/>
              </div>
            })
          }
        </div>
        <span className={'next-image'} onClick={nextImage}></span>
      </div>
    </div>
  )
}