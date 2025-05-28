import './css/input.css'
import {useRef, useState, useEffect} from "react";

export default function Input({
  label="Field", 
  autoFocus=false, 
  simple=false,
  ...props
}) {
  const inputRef = useRef(null)
  const [cls, setCls] = useState(props.className?.split(' ') || [])

  useEffect(() => {
    if(autoFocus) inputRef.current?.focus()
  }, [])

  function onFocus(e) {
    e.stopPropagation()
    e.preventDefault()

    cls.remove('focus')
    cls.push('focus')
    setCls([...cls])

    if (props.onFocus) {
      props.onFocus(e)
    }
  }

  function onBlur(e) {
    e.stopPropagation()
    e.preventDefault()

    if (!e.target.value) {
      cls.remove('focus')
      setCls([...cls])
    }

    if (props.onBlur) {
      props.onBlur(e)
    }
  }

  if (!!props.value && cls.indexOf('focus') === -1) {
    cls.push('focus')
  }

  return (
    <div className={`x-input-label ${cls.join(' ')}`} key={`x-input-label-key-${props.key}`}>
      {!simple && <div className='label-text' onClick={() => inputRef.current.focus()}>
          {label}
        </div>
      }
      <input
        {...props}
        ref={inputRef}
        onFocus={e => onFocus(e)}
        onBlur={e => onBlur(e)}
      />
    </div>
  )
}
