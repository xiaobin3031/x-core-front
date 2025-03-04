import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Note from "./page/note/Note.jsx";
import BrandAuto from './page/brand_auto/BrandAuto.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/*<Note />*/}
    <BrandAuto />
  </StrictMode>,
)
