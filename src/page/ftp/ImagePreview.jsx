import ajax from "../util/ajax.js";
import {useEffect, useRef} from "react";

export default function ImagePreview({file, onClose}) {

  const $img = useRef(null)

  useEffect(() => {
    loadImage().then(res => {})
  }, []);

  const showImage = (blob) => {
    const imgUrl = URL.createObjectURL(blob);
    if(!$img.current.onload) {
      $img.current.onload = () => {
        URL.revokeObjectURL(imgUrl);
      }
    }
    $img.current.src = imgUrl
  }

  const loadImage = async () => {
    let res = await ajax.post('/image-preview/show', {fileId: file.id}, {responseType: 'blob'})
    showImage(res)
  }

  const nextImage = async () => {
    let res = await ajax.post('/image-preview/next', {}, {responseType: 'blob'})
    showImage(res)
  }

  const prevImage = async () => {
    let res = await ajax.post('/image-preview/prev', {}, {responseType: 'blob'})
    showImage(res)
  }


  return (
    <div className={'image-preview'}>
      <div className='close-btn'>
        <button onClick={onClose} type='button'>关闭</button>
      </div>
      <div className='container'>
        <div className='image-prev btn-area' onClick={prevImage}>

        </div>
        <div className='image-body'>
          <img ref={$img} alt='image-body' />
        </div>
        <div className='image-next btn-area' onClick={nextImage}>

        </div>
      </div>
    </div>
  )
}