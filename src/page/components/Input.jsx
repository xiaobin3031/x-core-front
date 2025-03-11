import './css/input.css'
import {useRef, useState} from "react";

export default function Input({...props}) {
  let label = props.label || 'Field'
  const inputRef = useRef(null)
  const [cls, setCls] = useState(props.className?.split(' ') || [])

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

    cls.remove('focus')
    setCls([...cls])

    if (props.onBlur) {
      props.onBlur(e)
    }
  }

  return (
    <div className={`x-input-label ${cls.join(' ')}`}>
      <span onClick={e => inputRef.current.focus()}>{label}</span>
      <input
        style={props.style}
        ref={inputRef}
        key={props.key}
        name={props.name}
        className={props.className}
        value={props.value}
        onChange={props.onChange}
        disabled={!!props.disabled}
        onFocus={e => onFocus(e)}
        onBlur={e => onBlur(e)}
      />
    </div>
  )
}