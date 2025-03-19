import {StrictMode, useState} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import Note from "./page/note/Note.jsx";
import BrandAuto from './page/brand_auto/BrandAuto.jsx'
import Sql from "./page/sql/Sql.jsx";

const modes = [
  {
    id: 1,
    name: 'ss'
  },
  {
    id: 2,
    name: 'my'
  }
]
const navList = [
  {
    name: '笔记',
    modeId: [2],
    component: <Note/>
  },
  {
    name: '数据库',
    modeId: [2],
    component: <Sql/>
  },
  {
    name: '品牌测试',
    modeId: [1],
    component: <BrandAuto/>
  }
]

function Navs() {

  const [navItem, setNavItem] = useState(null)
  const [mode, setMode] = useState(null);

  function clickNav(nav) {
    setNavItem(nav.component)
  }

  function changeMode(e) {
    const modeId = e.target.value;
    setMode(modeId);
    setNavItem(navList.find(a => a.modeId === modeId)?.component)
  }

  return (
    <>
      <div className='navs'>
        <div>
          {/*  导航  */}
          <select onChange={changeMode}>
            {
              modes.map(mode => {
                return <option value={mode.id}>{mode.name}</option>
              })
            }
          </select>
        </div>
        <div>
          <ul>
            {
              navList.filter(nav => !nav.modeId || nav.modeId.indexOf(mode) > -1).map(nav => {
                return <li onClick={() => clickNav(nav)}>{nav.name}</li>
              })
            }
          </ul>
        </div>
      </div>
      <div className='container'>
        {!!navItem && navItem}
      </div>
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Navs/>
  </StrictMode>,
)
