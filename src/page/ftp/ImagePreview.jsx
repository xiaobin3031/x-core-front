import ajax from "../util/ajax.js";
import {useEffect, useRef, useState} from "react";

export default function ImagePreview({file, onClose}) {

  const $imgBody = useRef(null)
  const $index = useRef(null)
  const stopped = useRef(false)
  const [imgs, setImgs] = useState([])

  let loading = false
  useEffect(() => {
    initImage().then(() => {})

    const el = $imgBody.current;
    if (!el) return;

    const ua = navigator.userAgent;

    // 排除移动端和 iPad
    const isMobile = /Android|iPhone|iPod|iPad|Mobile/i.test(ua);
    const isTablet = /Tablet|iPad/i.test(ua);

    const isPc = !isMobile && !isTablet;
    const offsetTop = isPc ? 100 : 10

    let lastScrollTime = 0
    const onScroll = () => {
      const now = Date.now()
      if (!isPc && now - lastScrollTime < 500) return;
      lastScrollTime = now

      if(loading) return

      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - offsetTop
      const nearTop = el.scrollTop <= 10

      if (nearBottom) {
        loading = true
        // 滚动到底，加载下一张
        nextImage().finally(() => loading = false)
      }else if (nearTop) {
        loading = true;
        prevImage().finally(() => loading = false)  // 或者调用 prevImage()
      }
    };

    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        console.log('元素进入屏幕:', entry.target);
        // 一次后停止监听
        observer.unobserve(entry.target);
        nextImage().finally(() => loading = false)
      }
    });
  }, {
    root: null, // 默认为视口
    threshold: 0.01 // 元素 10% 可见时触发（可以设置为 0~1）
  });

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
    imgs.sort((a, b)=> a.id >= b.id ? 1 : -1)
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