import './Note.css'
import {useRef, useState} from "react";
import Util from "../util/util.js";
import constant from "./constant.js";

function NoteContent({note}) {

  const [contentList, setContentList] = useState(note.contentList);
  const inputDom = useRef(null);

  function initTodoContent(texts){
    return {
      id: Util.gId(),
      type: constant.note_type_todo,
      content: texts.slice(1).join(' '),
      props: {
        checked: false
      }
    }
  }

  function inputListen(e) {
    if (e.keyCode !== 13 || !e.target.value) return;

    const val = e.target.value;
    let content;
    if (val.trim().startsWith('/')) {
      const texts = val.trim().split(' ');
      const vval = texts.slice(1).join(' ')
      switch (texts[0]) {
        case '/page':
          if (!vval) return;
          content = {
            type: constant.note_type_page,
            content: texts.slice(1).join(' ')
          }
          break;
        case '/todo':
          content = initTodoContent(texts);
          break;
        case '/table':
          content = {
            type: constant.note_type_table,
            props: {
              heads: [{
                name: "field1"
              }, {
                name: "field2"
              }]
            },
            datas: [{}, {}]
          }
          break;
      }
    }
    if (!content) {
      content = {content: val, type: constant.note_type_text};
    }
    !!content.id && (content.id = Util.gId());
    setContentList([...contentList, content]);
    e.target.value = '';
  }

  function todoContentChange(e, item) {
    e.stopPropagation()
    item.content = e.target.value;
    setContentList([...contentList])
  }

  function enterToSaveTodoContent(e, contents, index, item) {
    e.stopPropagation()
    if (e.keyCode === 13) {
      item.content = e.target.value;
      contents.splice(index + 1, 0, initTodoContent([]))
      setContentList([...contentList])
    }else if(e.keyCode === 8){
      if(!e.target.value){
        contents.splice(index, 1);
        setContentList([...contentList])
      }
    }
  }

  function renderItemDom(contents) {
    return <>
      {
        contents.map((a, index) => {
          return (
            <div key={a.id} className={`note-content-list-item item-${a.type}`} onClick={e => e.stopPropagation()}>
              {a.type === constant.note_type_page && <div>{a.content}</div>}
              {a.type === constant.note_type_text && <div>{a.content}</div>}
              {
                a.type === constant.note_type_todo &&
                <>
                  <input type='checkbox' checked={!!a.props.checked}/>
                  <input type='text' defaultValue={a.content}
                         onBlur={e => todoContentChange(e, a)}
                         onKeyUp={e => enterToSaveTodoContent(e, contents, index, a)}/>
                </>
              }
              {
                a.type === constant.note_type_table &&
                <table>
                  <thead>
                  <tr>
                    {
                      a.props.heads.map(head => {
                        return <th>{head.name}</th>
                      })
                    }
                  </tr>
                  </thead>
                  <tbody>
                  <tr>
                    {
                      a.datas.map(data => {
                        return <td>{data.value}</td>
                      })
                    }
                  </tr>
                  </tbody>
                </table>
              }
            </div>
          )
        })
      }
    </>
  }

  function focusInput(e) {
    e.stopPropagation();
    e.preventDefault();
    inputDom.current.focus();
  }

  return (
    <div className='note-content-main' onClick={focusInput}>
      <div className='note-content-list'>
        {renderItemDom(contentList)}
      </div>
      <input ref={inputDom} type='text' name='note-input' onKeyUp={inputListen}/>
    </div>
  )
}

export default NoteContent;