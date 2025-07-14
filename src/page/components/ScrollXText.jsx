import {useEffect, useRef} from "react";

export default function ScrollXText({text}) {

  const $textView = useRef(null)

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      console.log(text, $textView.current.scrollWidth, $textView.current.clientWidth)
    })
    observer.observe($textView.current)
  }, []);

  return (
    <div className='scroll-x-text-view' title={text}>
      <div ref={$textView}>{text}</div>
    </div>
  )
}