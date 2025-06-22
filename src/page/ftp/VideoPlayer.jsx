// 视频播放器

import {DeleteIcon} from "../components/Icon.jsx";
import {useRef} from "react";

export default function VideoPlayer({fileToken, closePlayer}) {

  const player = useRef(null)
  let src = `${import.meta.env.VITE_API_BASE}:${import.meta.env.VITE_API_PORT}/media/play?fileToken=${fileToken}`

  return (
    <div className={"video-player"} ref={player}>
      <div className={"close-btn"}>
        <span onClick={closePlayer}><DeleteIcon fill={"#000000"}/></span>
      </div>
      <video src={src} autoPlay={true} controls={true}></video>
    </div>
  )
}