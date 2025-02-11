import {useState} from "react";
import NoteContent from "./NoteContent.jsx";
import Util from "../util/util.js";
import ajax from "../util/ajax.js";

function Note() {

  const [noteList, setNoteList] = useState(() => {
    ajax.get('/note/list').then(res => {
      const list = res.data || []
      fillNote(list);
      setNoteList(list)
    })
  })
  const [note, setNote] = useState(void 0)

  function createNotePage(e) {
    if (e.keyCode !== 13) {
      return;
    }

    const value = e.target.value;
    if (!value) return;

    if (noteList.every(a => a.name !== value)) {
      ajax.post('/note/add', {name: value}).then(res => {
        if(res.code === 0){
          const note = {name: value, id: Util.gId()}
          fillNote([note])
          setNoteList([...noteList, note])
        }
      })
    }

    e.target.value = '';
  }

  function fillNote(notes){
    if(!!notes && notes.length > 0){
      notes.forEach(n => {
        !n.children && (n.children = [])
        !n.contentList && (n.contentList = [])
      })
    }
  }

  function renderItem(notes, level) {
    return <>
      {
        !!notes && notes.map(a => {
          return (
            <div key={a.id} className='note-navs-list-item' onClick={() => setNote(a)}>
              {a.name}
            </div>
          )
        })
      }
    </>
  }

  return (
    <div className='note-main'>
      <div className='note-navs'>
        <div className='note-navs-list'>
          {renderItem(noteList, 0)}
        </div>
        <div className='note-navs-create'>
          <input type="text" name='note-to-create-name' placeholder='输入页面名称，回车后添加' onKeyUp={createNotePage}/>
        </div>
      </div>

      {!!note && <NoteContent note={note}/>}
    </div>
  )
}

export default Note;