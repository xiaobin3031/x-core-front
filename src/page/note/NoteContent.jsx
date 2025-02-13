import './Note.css'
import {useRef, useState} from "react";
import constant from "./constant.js";
import ajax from "../util/ajax.js";
import key from "../util/key.js";

function NoteContent({note}) {

  const [contentList, setContentList] = useState(() => {
    ajax.get('/note-content/list', {noteId: note.id}).then(res => {
      let list = res.data;
      if (!!list && list.length > 0) {
        const tableIds = list.filter(a => a.type === constant.note_type_table).map(a => a.id)
        ajax.get('/note-content/table-data-list', {'contentIds': tableIds}).then(res => {
          if (res.code === 0 && !!res.data) {
            const datasMap = res.data.reduce((a, b) => {
              let tt = a[b.contentId]
              if (!tt) tt = [];
              if (!!b.datas) {
                b.datas = JSON.parse(b.datas);
              }
              tt.push(b);
              a[b.contentId] = tt;
              return a;
            }, {})
            list.filter(a => a.type === constant.note_type_table)
              .forEach(a => {
                a.heads = JSON.parse(a.heads);
                a.orders = JSON.parse(a.orders);
                a.datas = datasMap[a.id]
                a.datas.filter(cc => !cc.datas).forEach(cc => {
                  cc.datas = []
                  a.heads.forEach(_ => cc.datas.push(''))
                })
                a.datas = sortList(a.datas);
              })
          }
          setContentList(list);
        })
      } else {
        list = [];
        setContentList(list);
      }
    })
  });
  const inputDom = useRef(null);

  function initTodoContent(texts) {
    return {
      type: constant.note_type_todo,
      content: texts.slice(1).join(' '),
      checked: false
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
            heads: ['field1', 'field2'],
            orders: [0, 1],
            datas: [
              {
                datas: ['', '']
              }
            ]
          }
          break;
      }
    }
    if (!content) {
      content = {content: val, type: constant.note_type_text};
    }
    const addContent = {...content}
    if (addContent.type === constant.note_type_table) {
      addContent.heads = JSON.stringify(addContent.heads);
      addContent.orders = JSON.stringify(addContent.orders);
      addContent.datas.forEach(a => a.datas = JSON.stringify(a.datas))
    }
    ajax.post('/note-content/add', addContent).then(res => {
      if (res.code === 0) {
        content.id = res.data.id;
        if (content.type === constant.note_type_table && res.data.datas?.length > 0) {
          content.datas = res.data.datas;
          content.datas.filter(a => !!a.datas).forEach(a => a.datas = JSON.parse(a.datas))
        }
        setContentList([...contentList, content]);
        e.target.value = '';
      }
    })
  }

  function todoContentChange(e, item) {
    e.stopPropagation()
    const val = e.target.value
    item.focus = false;
    if (val !== item.content) {
      ajax.post('/note-content/update', {id: item.id, content: val}).then(res => {
        if (res.code === 0) {
          item.content = e.target.value;
          setContentList([...contentList])
        }
      })
    } else {
      setContentList([...contentList])
    }
  }

  function enterToSaveTodoContent(e, contents, index, item) {
    e.stopPropagation()
    key.onEnter(e, () => {
      // enter
      if (item.content !== e.target.value) {
        item.content = e.target.value;
      }
      const newContent = initTodoContent([])
      newContent.afterId = item.id;

      const beforeContent = contents.filter(a => item.id === a.afterId)[0];

      Promise.all([ajax.post('/note-content/update', item), ajax.post('/note-content/add', newContent)]).then(([_, res2]) => {
        if (res2.code === 0) {
          newContent.id = res2.data.id;
          item.focus = false;
          newContent.focus = true;
          contents.splice(index + 1, 0, newContent)
          if (!!beforeContent) {
            ajax.post('/note-content/update', {
              id: beforeContent.id,
              afterId: newContent.afterId
            }).then(() => {
              beforeContent.afterId = newContent.id;
              setContentList([...contentList])
            });
          } else {
            setContentList([...contentList])
          }
        }
      });
    })
    key.onDelete(e, () => {
      // delete
      if (!e.target.value) {
        if (!!item.isEmpty) {
          // 如果已经是空了，则删掉
          ajax.post('/note-content/update', {id: item.id, deleted: true}).then(res => {
            if (res.code === 0) {
              contents.splice(index, 1);
              item.focus = false;
              if (index > 0) {
                contents[index - 1].focus = true;
                document.getElementById(`content-item-todo-${contents[index - 1].id}`)?.focus();
              }
              setContentList([...contentList])
            }
          })
        } else {
          // 设置成空，下次再按退格，就删掉
          item.isEmpty = true;
        }
      }
    })
  }

  function todoCheckChange(item) {
    ajax.post('/note-content/update', {id: item.id, checked: !item.checked}).then(res => {
      if (res.code === 0) {
        item.checked = !item.checked;
        setContentList([...contentList])
      }
    })
  }

  function headNameChange(e, item, index) {
    e.stopPropagation()
    const heads = [...item.heads]
    heads[index] = e.target.value
    ajax.post('/note-content/update', {id: item.id, heads: JSON.stringify(heads)}).then(res => {
      if (res.code === 0) {
        item.heads = [...heads]
        setContentList([...contentList])
      }
    })
  }

  function tableDataChange(e, item, index) {
    e.stopPropagation()
    const datas = [...item.datas]
    datas[index] = e.target.innerText
    ajax.post('/note-content/table-data-update', {id: item.id, datas: JSON.stringify(datas)}).then(res => {
      if (res.code === 0) {
        item.datas = [...datas]
        setContentList([...contentList])
      }
    })
  }

  function sortList(list) {
    if (!!list) {
      list.sort((a, b) => a.id - b.id);
      const newContents = [], hasAfterIdContents = [];
      list.forEach(a => {
        if (!!a.afterId || !!a.beforeId) {
          hasAfterIdContents.push(a);
        } else {
          newContents.push(a);
        }
      })
      const newList = [];
      hasAfterIdContents.forEach(a => {
        let index = -1;
        for (let i = 0; i < newContents.length; i++) {
          if (newContents[i].id === a.beforeId) {
            index = i;
            break;
          }
        }
        if (index === -1) {
          newList.push(a);
        } else {
          newContents.splice(index, 0, a);
        }
      })
      newList.forEach(a => {
        let index = -1;
        for (let i = 0; i < newContents.length; i++) {
          if (newContents[i].id === a.afterId) {
            index = i;
            break;
          }
        }
        if (index === -1) {
          newContents.push(a);
        } else {
          newContents.splice(index + 1, 0, a);
        }
      })
      list = [...newContents]
    }
    return list;
  }

  function addHead(item, index, before) {
    ajax.post('/note-content/table-add-field', {
      id: item.id,
      index: index,
      before: before
    }).then(res => {
      if (res.code === 0) {
        item.heads = JSON.parse(res.data.noteContent.heads);
        item.orders = JSON.parse(res.data.noteContent.orders);
        item.datas = [...res.data.datas]
        item.datas.forEach(a => a.datas = JSON.parse(a.datas))
        setContentList([...contentList])
      }
    })
  }

  function delHead(item, index) {
    const newItem = {
      id: item.id,
      orders: [...item.orders]
    }
    newItem.orders[index] = -1;
    newItem.orders = JSON.stringify(newItem.orders);
    ajax.post('/note-content/update', newItem).then(res => {
      if (res.code === 0) {
        item.orders[index] = -1;
        setContentList([...contentList])
      }
    })
  }

  function tableDataKeyChange(e, item, index){
    key.onEnter(e, () => {
      e.stopPropagation()
      e.preventDefault()
      let txt = e.target.innerText
      const selectedIndex = e.target.selectedIndex
      txt = txt.substring(0, selectedIndex) + '%n' + txt.substring(selectedIndex);
      item.datas[index] = txt
      setContentList([...contentList])
    })
  }

  function renderItemDom(contents) {
    // 做一次排序
    contents = sortList(contents);

    let lastType = -1;
    return <>
      {
        !!contents && contents.map((a, index) => {
          let hasMargin = '';
          if (a.type === constant.note_type_todo) {
            if (lastType !== a.type) {
              hasMargin = 'has-margin';
            }
          } else {
            hasMargin = 'has-margin';
          }
          lastType = a.type;
          return (
            <div key={a.id} className={`note-content-list-item item-${a.type} ${hasMargin}`}
                 onClick={e => e.stopPropagation()}>
              {a.type === constant.note_type_page && <div>{a.content}</div>}
              {a.type === constant.note_type_text && <div>{a.content}</div>}
              {
                a.type === constant.note_type_todo &&
                <>
                  <input type='checkbox' checked={!!a.checked} onChange={() => todoCheckChange(a)}/>
                  <input id={`content-item-todo-${a.id}`} type='text' defaultValue={a.content} autoFocus={!!a.focus}
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
                      a.orders.filter(o => o > -1).map(o => {
                        return <th key={`table-head-${o}-${a.heads[o]}`}>
                          <div className='table-field-option del' onClick={() => delHead(a, o)}>-</div>
                          <div className='table-field-option add-before' onClick={() => addHead(a, o, true)}>+</div>
                          <input type='text' defaultValue={a.heads[o]}
                                 onBlur={e => headNameChange(e, a, o)}/>
                          <div className='table-field-option add-after' onClick={() => addHead(a, o, false)}>+</div>
                        </th>
                      })
                    }
                  </tr>
                  </thead>
                  <tbody>
                  {
                    a.datas.map(data => {
                      return (
                        <tr key={`item-table-data-${data.id}`}>
                          {
                            a.orders.filter(o => o > -1).map(o => {
                              return <td key={`table-data-${data.id}-${o}`}>
                                <div suppressContentEditableWarning className='edit-div' contentEditable
                                     onKeyUp={e => tableDataKeyChange(e, data, o)}
                                     onBlur={e => tableDataChange(e, data, o)}
                                >
                                </div>
                              </td>
                            })
                          }
                        </tr>
                      )
                    })
                  }
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
      <div className='note-content-head'>
        <div className='note-content-head-title'>{note.name}</div>
      </div>
      <div className='note-content-list'>
        {renderItemDom(contentList)}
      </div>
      <input ref={inputDom} type='text' name='note-input' onKeyUp={inputListen}/>
    </div>
  )
}

export default NoteContent;