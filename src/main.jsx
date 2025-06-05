import {StrictMode, useState, useRef} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import Note from "./page/note/Note.jsx";
import BrandAuto from './page/brand_auto/BrandAuto.jsx'
import Sql from "./page/sql/Sql.jsx";
import Ftp from "./page/ftp/Ftp.jsx";
import user from "./page/util/user.js"
import ajax from "./page/util/ajax.js";

const modes = [
  {
    id: 1,
    name: 'ss'
  },
  {
    id: 2,
    name: 'my'
  },
  {
    id: 3,
    name: 'home'
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
  },
  {
    name: '网盘',
    modelId: [3],
    component: <Ftp />
  }
]

function Navs() {

  const [navItem, setNavItem] = useState(null)
  const [mode, setMode] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false)

  const agreeAutoRegister = useRef(null);
  const usernameInput = useRef(null)
  const passwordInput = useRef(null);

  function clickNav(nav) {
    setNavItem(nav.component)
  }

  function changeMode(e) {
    const modeId = +e.target.value;
    setMode(modeId);
    setNavItem(navList.find(a => a.modeId === modeId)?.component)
  }

  const login = () => {
    const data = {
      username: usernameInput.current.value,
      password: passwordInput.current.value,
      agree: agreeAutoRegister.current.value
    }
    ajax.post('/user/login', data).then(res => {
      user.save(res.data)
    })
  }

  const userInfo = user.get()

  return (
    <div>
      <header className="main-header">
        <div className='navs'>
          <div className='nav-mode'>
            <select onChange={changeMode}>
              {
                modes.map(mode => {
                  return <option key={`nav-mode-${mode.id}`} value={mode.id}>{mode.name}</option>
                })
              }
            </select>
          </div>
        </div>
        <div className='user-info'>
          {
            !!userInfo && <div className='user-info-item'>
              <span>{userInfo.name}</span>
            </div>
          }
          {
            !userInfo && <div className='user-info-item'>
              <a onClick={() => setShowLoginModal(true)}>Login</a>
            </div>
          }
        </div>
      </header>
      <div className="main-container">
        {
          !navItem &&
            <div className='nav-container'>
              <ul>
                {
                  navList.filter(nav => !nav.modeId || nav.modeId.indexOf(mode) > -1).map((nav,index) => {
                    return <li key={`nav-item-${nav.modeId}-${index}`} onClick={() => clickNav(nav)}><span>{nav.name}</span></li>
                  })
                }
              </ul>
            </div>
        }
        {
          !!navItem && <div className='container'>{navItem}</div>
        }
      </div>
      {
        !!showLoginModal &&
          <div className="login-modal">
            <div className="login-username">
              <input type="text" name="username" ref={usernameInput}/>
            </div>
            <div className="login-password">
              <input type="password" name="password" ref={passwordInput}/>
            </div>
            <div className="login-btns">
              <div><input type="checkbox" ref={agreeAutoRegister} />Auto Register</div>
              <div>
                <button type="button" onClick={login}>Login</button>
                <button type="button">Close</button>
              </div>
            </div>
          </div>
      }

    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Navs/>
  </StrictMode>,
)
