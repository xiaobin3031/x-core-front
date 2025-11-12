// 视频播放器
import user from "../util/user.js";
import {DeleteIcon} from "../components/Icon.jsx";
import {useRef} from "react";

export default function VideoPlayer({file, closePlayer}) {

  const player = useRef(null)
  const token = !!user.get() && user.get().token
  let src = `${import.meta.env.VITE_API_BASE}:${import.meta.env.VITE_API_PORT}/media/play?fileId=${file.id}&token=${token}`
  if(!!file.start && !!file.end) {
    src += `#t=${file.start},${file.end}`
  }

  return (
    <div className={"video-player"} ref={player} style={{maxWidth: '100%', maxHeight: '100%'}}>
      <div className={"close-btn"}>
        <span onClick={closePlayer}><DeleteIcon fill={"#000000"}/></span>
      </div>
      <video src={src} autoPlay={true} controls={true} style={{maxWidth: '100%', maxHeight: '100%'}}></video>
    </div>
  )
}
