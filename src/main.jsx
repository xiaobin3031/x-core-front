import {StrictMode, useState, useRef} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import Note from "./page/note/Note.jsx";
import BrandAuto from './page/brand_auto/BrandAuto.jsx'
import Sql from "./page/sql/Sql.jsx";
import Ftp from "./page/ftp/Ftp.jsx";
import user from "./page/util/user.js"
import ajax from "./page/util/ajax.js";
import message from "./page/components/Message.jsx";

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
        component: <Ftp/>
    }
]

function Navs() {

    const [navItem, setNavItem] = useState(null)
    const [mode, setMode] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false)
    const [userInfo, setUserInfo] = useState(user.get())

    const agreeAutoRegister = useRef(null);
    const usernameInput = useRef(null)
    const passwordInput = useRef(null);
    const loginCallback = useRef(null)

    function clickNav(nav) {
        if (!user.isLogin()) {
            loginCallback.current = () => {
                setNavItem(nav.component)
            }
            setShowLoginModal(true)
            return
        }
        setNavItem(nav.component)
    }

    function changeMode(e) {
        const modeId = +e.target.value;
        setMode(modeId);
        setNavItem(navList.find(a => a.modeId === modeId)?.component)
    }

    const login = async () => {
        const data = {
            username: usernameInput.current.value,
            password: passwordInput.current.value,
            agree: agreeAutoRegister.current.value === 'on'
        }
        let res = await ajax.post('/login', data)
        user.save(res)
        setUserInfo(res)
        setShowLoginModal(false)
        if (!!loginCallback.current) {
            loginCallback.current()
            loginCallback.current = null
        }
    }

    return (
        <>
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
                            <span>{userInfo.username}</span>
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
                                navList.filter(nav => !nav.modeId || nav.modeId.indexOf(mode) > -1).map((nav, index) => {
                                    return <li key={`nav-item-${nav.modeId}-${index}`} onClick={() => clickNav(nav)}>
                                        <span>{nav.name}</span></li>
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
                    <div className='modal-content'>
                        <div className="login-username">
                            <label>用户名</label>
                            <input type="text" name="username" ref={usernameInput}/>
                        </div>
                        <div className="login-password">
                            <label>密&nbsp;&nbsp;&nbsp;码</label>
                            <input type="password" name="password" ref={passwordInput}/>
                        </div>
                        <div className="login-btns">
                            <label><input type="checkbox" ref={agreeAutoRegister}/>自动注册</label>
                            <div>
                                <button type="button" onClick={() => setShowLoginModal(false)}>Close</button>
                                <button type="button" onClick={login}>Login</button>
                            </div>
                        </div>
                    </div>
                </div>
            }
        </>
    )
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Navs/>
    </StrictMode>,
)
