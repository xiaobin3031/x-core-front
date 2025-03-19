import './sql.css'
import {useRef, useState} from "react";
import Input from "../components/Input.jsx";
import ajax from "../util/ajax.js";

export default function Sql({}) {

  return (
    <>
      <SqlTable connName='mp' tableName='ss_mall_order' schemaName='shanshan-order' />
    </>
  )
}

/**
 * 数据表格
 */
export function SqlTable({connName, tableName, schemaName}) {

  const queryData = useRef({})
  const [page, setPage] = useState(1)
  const [cols, setCols] = useState([])
  const [datas, setDatas] = useState([])
  const [total, setTotal] = useState(0)
  const size = 10
  let pages = total / size
  if (total % size !== 0) {
    pages++;
  }
  const pageList = Array.from({length: pages}, (v, k) => k + 1)

  function changeQueryData(e) {
    if (e.target.value === '' || e.target.value === null) {
      delete queryData[e.target.name]
    } else {
      queryData[e.target.name] = e.target.value;
    }
  }

  function changePage(a) {
    setPage(a)
    loadData(a)
  }

  function loadData(page) {
    ajax.post('/sql/query', {connName, tableName, schemaName, page, size, query: queryData})
      .then(res => {
        setDatas(res.data?.datas || [])
        setTotal(res.data?.total || 0)
        setCols(res.data?.cols || [])
      })
  }

  return (
    <>
      <table>
        <thead>

        <tr className='query-trs'>
          {
            cols.map(col => {
              return (
                <th>
                  <Input name={col.col} value={queryData[col.col]} onChange={changeQueryData}/>
                </th>
              )
            })
          }
        </tr>
        <tr>
          {
            cols.map(col => {
              return <th>{col.name || col.col}</th>
            })
          }
        </tr>
        </thead>
        <tbody>
        {
          datas.map(data => {
            return (
              <tr>
                {
                  cols.map(col => {
                    return <td>{data[col.col]}</td>
                  })
                }
              </tr>
            )
          })
        }
        </tbody>
        <tfoot>
        <tr>
          <td colSpan={cols.length}>
            <span>total: {total}</span>
            {
              total > 0 &&
              <div className='sql-page'>
                {
                  pageList.map(a => {
                    return <a className={page === a ? 'active' : ''} key={`sql-page-item-${a}`}
                              onClick={() => changePage(a)}>{a}</a>
                  })
                }
              </div>
            }
          </td>
        </tr>
        </tfoot>
      </table>
    </>
  )
}