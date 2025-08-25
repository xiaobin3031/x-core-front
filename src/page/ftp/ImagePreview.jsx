import ajax from "../util/ajax.js";
import {useEffect, useRef} from "react";

export default function ImagePreview({file, onClose}) {

  const $imgBody = useRef(null)
  const $imgList = useRef(null)
  const loading = useRef(false)

  useEffect(() => {
    initImage().then(() => {})

    const el = $imgBody.current;
    if (!el) return;

    const onScroll = async () => {
      if(loading.current) return
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
        loading.current = true
        // 滚动到底，加载下一张
        await nextImage('/image-preview/next')
        loading.current = false
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

  const showImage = (blob) => {
    const $tmp = document.createElement('img')
    $tmp.alt = 'image-item'
    const imgUrl = URL.createObjectURL(blob);
    if(!$tmp.onload) {
      $tmp.onload = () => {
        URL.revokeObjectURL(imgUrl);
      }
    }
    $tmp.src = imgUrl
    $imgList.current.appendChild($tmp)

    while($imgList.current.children.length > 5) {
      $imgList.current.removeChild($imgList.current.children[0])
    }
  }

  const loadImage = async () => {
    let res = await ajax.post('/image-preview/show', {fileId: file.id}, {responseType: 'blob'})
    showImage(res)
  }

  const nextImage = async () => {
    let res = await ajax.post('/image-preview/next', {}, {responseType: 'blob'})
    showImage(res)
  }


  return (
    <div className={'image-preview'}>
      <div className='close-btn'>
        <button onClick={onClose} type='button'>关闭</button>
      </div>
      <div className='container'>
        <div className='image-body' ref={$imgBody}>
          <div ref={$imgList}></div>
        </div>
      </div>
    </div>
  )
}