import './css/modal.css'
import util from "../util/util.js";

import {useRef} from 'react'

export default function Modal({children, title, onClose, onOk}){

  const modalRef = useRef(null)

  return (
    <div className="modal" ref={modalRef} style={{'zIndex': util.modalId()}}>
      <div className='modal-content'>
        <div className='modal-head'>{title}</div>
        <div className="modal-body">
          {children}
        </div>
        <div className='modal-foot'>
          <button className='modal-btn-close' onClick={onClose}>Close</button>
          <button className='modal-btn-ok' onClick={onOk}>Ok</button>
        </div>
      </div>
    </div>
  )
}
