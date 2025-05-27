import './css/modal.css'
import util from "../util/util.js";

import {useRef, useState} from 'react'

export default function Modal({children}){

  const modalRef = useRef(null)

  return (
    <div className="modal" ref={modalRef} style={{'zIndex': util.modalId()}}>
      <div className="modal-content">
        {children}
      </div>
    </div>
  )
}
