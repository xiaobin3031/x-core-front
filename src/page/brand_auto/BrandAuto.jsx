import './BrandAuto.css'
import {useRef, useState} from "react";
import ajax from "../util/ajax.js";
import constant from "./constant.js";
import Input from "../components/Input.jsx";

/**
 * 品牌自动化接口测试
 * @returns
 * @constructor
 */
export default function BrandAuto({}) {

  const [testId, setTestId] = useState("")
  const [scenesList, setScenesList] = useState([])
  const [flowList, setFlowList] = useState([])
  const [curFlowId, setCurFlowId] = useState(0)
  // 存一份公共的，其他页面自动带入
  const [orderGoodsInfo, setOrderGoodsInfo] = useState([])
  const [waitTime, setWaitTime] = useState(0);

  const createGoodsInfo = useRef([{
    spuCode: '',
    skuCode: '',
    number: 1
  }])
  const automaticData = useRef({})
  const curInfo = useRef({
    sceneId: 0, flowId: 0
  })

  function RenderItem({flow}) {
    return (
      <>
        {
          flow.flowInfo.flowType === 8 && <BrandInvokeFlow flow={flow}/>
        }
        {
          flow.flowInfo.flowType === 1 && <CreateOrderFlow flow={flow}/>
        }
        {
          flow.flowInfo.flowType === 7 && <CreateReportFlow flow={flow}/>
        }
        {
          flow.flowInfo.flowType === 10 && <OrderFetchedResultFlow flow={flow}/>
        }
        {
          flow.flowInfo.flowType === 9 && <InvokeAdminHttpFlow flow={flow}/>
        }
        {
          flow.flowInfo.flowType === 11 && <OrderGoodsShipCheckFlow flow={flow}/>
        }
        {
          flow.flowInfo.flowType === 12 && <OrderPayTimeChangeFlow flow={flow}/>
        }
        {
          flow.flowInfo.flowType === 13 && <OrderStatusChangeFlow flow={flow}/>
        }
        {
          flow.flowInfo.flowType === 14 && <OrderStatusCheckFlow flow={flow}/>
        }
        {
          flow.flowInfo.flowType === 15 && <ReturnOrderRefundFlow flow={flow}/>
        }
      </>
    )
  }

  function BrandInvokeFlow({flow}) {
    const flowInfo = flow.flowInfo, extData = flow.extData
    return (
      <FlowDiv flowInfo={flowInfo}>
        <div className="flow-card-head">
          {flowInfo.flowName}
          <span className='errmsg-span'>{flow.errMsg}</span>
        </div>
        <div className="flow-card-body">
          <div>{extData.brandMethod}</div>
        </div>
      </FlowDiv>
    )
  }

  function nextSceneAndFlow(result) {
    if (curInfo.current.sceneId === result.curSceneId && curInfo.current.flowId === result.curFlowId) return;

    curInfo.current.sceneId = result.curSceneId
    curInfo.current.flowId = result.curFlowId
    setCurFlowId(result.curFlowId)
    setCurFlowStep(constant.flow_active)

    if (!!result.finish) {
      unlockAllScene()
    }

    if (!result.finish && !!result.end) {
      showCurFlow().then(() => {
      })
    }

  }

  async function showCurFlow() {
    const curFlow = scenesList.filter(scene => curInfo.current.sceneId === scene.sceneId)[0]?.flowInfoList.filter(flow => flow.flowInfo.flowId === curInfo.current.flowId)[0]
    if (!!curFlow?.flowInfo?.automatic) {
      let res;
      while (true) {
        setCurFlow(a => {
          a.step = constant.flow_active
          a.loading = true
        })
        res = await execAutomatic()
        if (!!res && !!res.data?.end) {
          curFlow.errMsg = ''
          break;
        }
        if (!!res?.data?.errMsg) {
          curFlow.errMsg = res.data.errMsg
          setFlowList([...flowList])
        }
      }
      if (!!res && !!res.data?.end) {
        setCurFlowStep(constant.flow_end)
      } else {
        setFlowList([...flowList])
      }
      if (!res.data.finish) {
        nextSceneAndFlow(res.data);
      } else {
        scenesList.filter(scene => curInfo.current.sceneId === scene.sceneId)
          .forEach(scene => {
            scene.finish = true;
          })
        scenesList.forEach(a => a.locked = false)
        setScenesList([...scenesList])
        setCurFlowId(0)
        curInfo.current.flowId = 0
        curInfo.current.sceneId = 0
      }
    }
  }

  function execAutomatic() {
    const data = {
      ...automaticData,
      testId: testId,
      sceneId: curInfo.current.sceneId,
      flowId: curInfo.current.flowId
    }
    return new Promise((resolve) => {
      ajax.post("/brand/flows/exec", data).then(res => {
        let timeout = 5
        setWaitTime(5)
        setCurFlowStep(constant.flow_pause)
        let interval = setInterval(() => {
          timeout--;
          setWaitTime(timeout)
        }, 1000)
        setTimeout(() => {
          setWaitTime(0)
          clearInterval(interval)
          interval = void 0
          resolve(res)
        }, 5_000)
      })
        .finally(() => setCurFlow(a => a.loading = false))
    })
  }

  function setCurFlowStep(step) {
    flowList.filter(a => a.flowInfo.flowId === curInfo.current.flowId)
      .forEach(a => a.step = step)
    setFlowList([...flowList])
  }

  function setCurFlow(callback) {
    flowList.filter(a => a.flowInfo.flowId === curInfo.current.flowId)
      .forEach(a => callback(a))
    setFlowList([...flowList])
  }

  function CreateOrderFlow({flow}) {

    const flowInfo = flow.flowInfo

    const [curCreateGoods, setCurCreateGoods] = useState([...(flowInfo.goodsList || createGoodsInfo.current)])
    const [orderInfo, setOrderInfo] = useState({})

    const loading = useRef(false)

    function isDisable() {
      return flow.step === constant.flow_end || loading.current;
    }

    function goodsInfoChange(e, goods, key) {
      goods[key] = e.target.value
      setCurCreateGoods([...curCreateGoods])
    }

    function addNewGoods(index) {
      if (isDisable() || curCreateGoods.some(a => !a.spuCode || !a.skuCode || a.number <= 0)) return;

      const item = {
        spuCode: '', skuCode: '', number: 1
      }
      curCreateGoods.splice(index + 1, 0, item)
      setCurCreateGoods([...curCreateGoods])
    }

    function removeGoods(index) {
      if (isDisable() || curCreateGoods.length <= 1) return

      curCreateGoods.splice(index, 1)
      setCurCreateGoods([...curCreateGoods])
    }

    function orderInfoChange(e, key) {
      if (isDisable()) return;

      orderInfo[key] = e.target.value
      setOrderInfo({...orderInfo})
    }

    function createOrder() {
      if (isDisable()) return;

      if (curCreateGoods.some(a => !a.spuCode || !a.skuCode || a.number <= 0)) {
        flow.errMsg = '请填写spuCode, skuCode, number'
        setFlowList([...flowList])
        return;
      }

      const data = {}
      data.promotionPrice = +(orderInfo.promotionPrice || 0);
      data.vipPrice = +(orderInfo.vipPrice || 0);
      data.vipPrice = +(orderInfo.vipPrice || 0);
      data.integralPrice = +(orderInfo.integralPrice || 0);
      data.couponPrice = +(orderInfo.couponPrice || 0);
      data.couponMallPrice = +(orderInfo.couponMallPrice || 0);
      data.cashPrice = +(orderInfo.cashPrice || 0);
      data.freightPrice = +(orderInfo.freightPrice || 0);
      data.goodsList = curCreateGoods.map(a => {
        return {
          spuCode: a.spuCode,
          skuCode: a.skuCode,
          number: +a.number
        }
      })

      loading.current = true
      flowList.filter(a => a.flowInfo.flowId === curInfo.current.flowId)
        .forEach(a => a.loading = true)
      flow.errMsg = ''
      setFlowList([...flowList])
      ajax.post('/brand/flows/exec', {
        testId: testId,
        orderCreateInfo: data,
        sceneId: curInfo.current.sceneId,
        flowId: curFlowId
      }).then(res => {
        if (res.code === 0 && !!res.data) {
          if (!!res.data.errMsg) {
            flow.errMsg = res.data.errMsg
          } else {
            lockOtherScene()
            setOrderGoodsInfo([...data.goodsList])
            flow.orderSn = res.data.orderSn
            flow.goodsList = [...data.goodsList]
            if (!!res.data.end) {
              setCurFlowStep(constant.flow_end)
            }
            automaticData.orderSn = res.data.orderSn
            flow.errMsg = ''
            nextSceneAndFlow(res.data)
          }
        }
      }).finally(() => {
        loading.current = false
        flowList.filter(a => a.flowInfo.flowId === curInfo.current.flowId)
          .forEach(a => a.loading = false)
        setFlowList([...flowList])
      })
    }

    function resetOrder() {
      if (isDisable()) return;

      setOrderInfo({})
      setCurCreateGoods([{
        spuCode: '',
        skuCode: '',
        number: 1
      }])
      flow.errMsg = ''
      flow.goodsList = void 0
      setFlowList([...flowList])
    }

    return (
      <FlowDiv flowInfo={flowInfo} cls='order-create'>
        <div className="flow-card-head">
          {flowInfo.flowName}
          {
            !!flow.orderSn && <span>
              订单编号：
              <span className='order-sn-span'>{flow.orderSn}</span>
            </span>
          }
          <span className='errmsg-span'>{flow.errMsg}</span>
        </div>
        <div className="flow-card-body">
          {
            curCreateGoods.map((goods, index) => {
              return (
                <>
                  <div className="order-create-goods" key={`flow-create-goods-${flowInfo.flowId}-${index}`}>
                    <Input label='SpuCode' name="spuCode" value={goods.spuCode}
                           disabled={flow.step === constant.flow_end}
                           onChange={e => goodsInfoChange(e, goods, 'spuCode')}/>
                    <Input label='SkuCode' name="skuCode" value={goods.skuCode}
                           disabled={flow.step === constant.flow_end}
                           onChange={e => goodsInfoChange(e, goods, 'skuCode')}/>
                    <Input label='Number' name="number" type="number" value={goods.number}
                           disabled={flow.step === constant.flow_end}
                           onChange={e => goodsInfoChange(e, goods, 'number')}/>
                    <div className='icon-btns'>
                      <svg className={`icon-btn ${flow.step === constant.flow_end ? 'disabled' : ''}`}
                           viewBox="0 0 1024 1024"
                           xmlns="http://www.w3.org/2000/svg" width="30"
                           height="30" onClick={() => addNewGoods(index)}>
                        <path
                          d="M522.91911789 95.88235284a397.05882358 397.05882358 0 1 1 0 794.11764716A397.05882358 397.05882358 0 0 1 522.91911789 95.88235284z m0 64.52205854a332.53676504 332.53676504 0 1 0 0 665.07353009A332.53676504 332.53676504 0 0 0 522.91911789 160.40441138z"
                          fill="green"></path>
                        <path
                          d="M329.70036789 460.68014715m32.26102926 0l321.96507358 0q32.26102927 0 32.26102927 32.26102927l0 0q0 32.26102927-32.26102927 32.26102926l-321.96507357 0q-32.26102927 0-32.26102927-32.26102926l0 0q0-32.26102927 32.26102926-32.26102927Z"
                          fill="green"></path>
                        <path
                          d="M555.18014715 299.72242642m0 32.26102926l0 321.96507359q0 32.26102927-32.26102926 32.26102926l0 0q-32.26102927 0-32.26102927-32.26102926l0-321.96507359q0-32.26102927 32.26102927-32.26102926l0 0q32.26102927 0 32.26102927 32.26102926Z"
                          fill="green"></path>
                      </svg>
                      <svg className={`icon-btn ${flow.step === constant.flow_end ? 'disabled' : ''}`}
                           viewBox="0 0 1024 1024"
                           xmlns="http://www.w3.org/2000/svg" width="30"
                           height="30" onClick={() => removeGoods(index)}>
                        <path
                          d="M525.54963211 117.21568617a397.05882358 397.05882358 0 1 1 0 794.11764716A397.05882358 397.05882358 0 0 1 525.54963211 117.21568617z m0 64.52205854a332.53676504 332.53676504 0 1 0 0 665.07353009A332.53676504 332.53676504 0 0 0 525.54963211 181.73774471z"
                          fill="red"></path>
                        <path
                          d="M332.33088211 482.01348048m32.26102927 0l321.96507358 0q32.26102927 0 32.26103008 32.26102927l0 0q0 32.26102927-32.26103008 32.26102926l-321.96507358 0q-32.26102927 0-32.26102927-32.26102926l0 0q0-32.26102927 32.26102927-32.26102927Z"
                          fill="red"></path>
                      </svg>
                    </div>
                  </div>
                </>
              )
            })
          }

          <div className="order-create-price">
            <div>
              <Input label='促销优惠金额' className="price" name="promotionPrice"
                     value={orderInfo.promotionPrice}
                     disabled={flow.step === constant.flow_end}
                     onChange={e => orderInfoChange(e, 'promotionPrice')}/>
              <Input label='vip优惠金额' className="price" name="vipPrice" value={orderInfo.vipPrice}
                     disabled={flow.step === constant.flow_end}
                     onChange={e => orderInfoChange(e, 'vipPrice')}/>
              <Input label='积分抵现金额' className="price" name="integralPrice"
                     value={orderInfo.integralPrice}
                     disabled={flow.step === constant.flow_end}
                     onChange={e => orderInfoChange(e, 'integralPrice')}/>
            </div>
            <div>
              <Input label='店铺券优惠金额' className="price" name="couponPrice" value={orderInfo.couponPrice}
                     disabled={flow.step === constant.flow_end}
                     onChange={e => orderInfoChange(e, 'couponPrice')}/>
              <Input label='广场券优惠金额' className="price" name="couponMallPrice" value={orderInfo.couponMallPrice}
                     disabled={flow.step === constant.flow_end}
                     onChange={e => orderInfoChange(e, 'couponMallPrice')}/>
              <Input label='代金券优惠金额' className="price" name="cashPrice" value={orderInfo.cashPrice}
                     disabled={flow.step === constant.flow_end}
                     onChange={e => orderInfoChange(e, 'cashPrice')}/>
            </div>

            <div>
              <Input label='运费' className="price" name="freightPrice" value={orderInfo.freightPrice}
                     disabled={flow.step === constant.flow_end}
                     onChange={e => orderInfoChange(e, 'freightPrice')}/>
            </div>
          </div>
        </div>
        <div className="flow-card-foot">
          <div className="flow-card-foot-btn">
            <button type="button" className='create' onClick={createOrder} disabled={flow.step === constant.flow_end}>创
              建
            </button>
            <button type="button" className='reset' onClick={resetOrder} disabled={flow.step === constant.flow_end}>重
              置
            </button>
          </div>
        </div>
      </FlowDiv>
    )
  }

  function CreateReportFlow({flow}) {
    const flowInfo = flow.flowInfo
    return (
      <FlowDiv flowInfo={flowInfo}>
        <div className="flow-card-head">{flowInfo.flowName}</div>
        <div className="flow-card-body">
          <div>
            <button type="button">下载报告</button>
          </div>
        </div>
      </FlowDiv>
    )
  }

  function OrderFetchedResultFlow({flow}) {
    const flowInfo = flow.flowInfo
    return (
      <FlowDiv flowInfo={flowInfo}>
        <div className="flow-card-head">{flowInfo.flowName}</div>
        <div className="flow-card-body">
          ... 等待结果
        </div>
      </FlowDiv>
    )
  }

  function InvokeAdminHttpFlow({flow}) {
    const flowInfo = flow.flowInfo, extData = flow.extData
    return (
      <FlowDiv flowInfo={flowInfo}>
        <div className="flow-card-head">{flowInfo.flowName}</div>
        <div className="flow-card-body">
          <div>
            <pre>{extData.httpMethod}</pre>
            <span>{extData.url}</span>
          </div>
        </div>
      </FlowDiv>
    )
  }

  function OrderGoodsShipCheckFlow({flow}) {
    const flowInfo = flow.flowInfo
    return (
      <FlowDiv flowInfo={flowInfo}>
        <div className="flow-card-head">{flowInfo.flowName}</div>
        <div className="flow-card-body">
          {
            orderGoodsInfo.map(orderGoods => {
              return (
                <div>
                  <label>
                    <input type="checkbox" name="sku-{orderGoods.skuCode}-checkbox"/>
                    <label>SPU:</label>
                    <span>{orderGoods.goodsSn}</span>
                    <label>SKU:</label>
                    <span>{orderGoods.skuCode}</span>
                    <label>NUMBER:</label>
                    <span>{orderGoods.number}</span>
                    <label>SHIP NUMBER:</label>
                    <span>{orderGoods.shipNumber}</span>
                  </label>
                </div>
              )
            })
          }
        </div>
      </FlowDiv>
    )
  }

  function OrderPayTimeChangeFlow({flow}) {
    const flowInfo = flow.flowInfo, extData = flow.extData
    return (
      <FlowDiv flowInfo={flowInfo}>
        <div className="flow-card-head">{flowInfo.flowName}</div>
        <div className="flow-card-body">
          修改时间: {extData.hours}
        </div>
      </FlowDiv>
    )
  }

  function OrderStatusChangeFlow({flow}) {
    const flowInfo = flow.flowInfo, extData = flow.extData
    return (
      <FlowDiv flowInfo={flowInfo}>
        <div className="flow-card-head">{flowInfo.flowName}</div>
        <div className="flow-card-body">
          修改订单状态: {extData.orderStatus}
        </div>
      </FlowDiv>
    )
  }

  function OrderStatusCheckFlow({flow}) {
    const flowInfo = flow.flowInfo, extData = flow.extData
    return (
      <FlowDiv flowInfo={flowInfo}>
        <div className="flow-card-head">{flowInfo.flowName}</div>
        <div className="flow-card-body">
          <div>
            订单状态: {extData.orderStatus}
          </div>
          {
            !!extData.minOrderStatus &&
            <div>
              最低订单状态: {extData.minOrderStatus}
            </div>
          }
        </div>
      </FlowDiv>
    )
  }

  function ReturnOrderRefundFlow({flow}) {
    const flowInfo = flow.flowInfo
    return (
      <FlowDiv flowInfo={flowInfo}>
        <div className="flow-card-head">{flowInfo.flowName}</div>
        <div className="flow-card-body">
          售后订单退款
        </div>
      </FlowDiv>
    )
  }

  function FlowDiv({flowInfo, children, cls = ''}) {
    return (
      <div key={`key-flow-card-${flowInfo.flowId}`} className={`flow-card ${cls}`}>
        {children}
      </div>
    )
  }

  function newTest() {
    if (!!testId) {
      if (window.confirm("当前测试未完成，是否新建一个新的")) {
        createTest();
      }
    } else {
      createTest()
    }
  }

  function createTest() {
    ajax.post('/brand/test/create', {
      "oriTestId": testId
    }).then(res => {
      setTestId(res.data.testId)
      setScenesList(res.data.sceneInfoList)
      curInfo.current.sceneId = 0
    })
  }

  function openScene(scene) {
    const curScene = scenesList.filter(a => a.sceneId === curInfo.current.sceneId)[0]
    if (!!curScene && !curScene.finish && !!curScene.locked) {
      return;
    }
    scenesList.filter(a => a.sceneId !== scene.sceneId).forEach(a => a.active = false)
    scene.active = true
    setScenesList([...scenesList])
    curInfo.current.sceneId = scene.sceneId
    const curFlow = scene.flowInfoList.filter(a => a.step !== constant.flow_end)[0]
    if (!!curFlow) {
      const flowId = curFlow.flowInfo.flowId
      setCurFlowId(flowId)
      curInfo.current.flowId = flowId
      scene.flowInfoList.filter(a => !a.step && flowId !== a.flowInfo.flowId).forEach(a => a.step = constant.flow_wait)
      curFlow.step = constant.flow_active
      setFlowList(scene.flowInfoList)
    }
  }

  function lockOtherScene() {
    scenesList.forEach(a => a.locked = true);
    setScenesList([...scenesList])
  }

  function unlockAllScene() {
    scenesList.forEach(a => a.locked = false)
  }

  return (
    <>
      <div>
        <label htmlFor="test-id"><input type="text" value={testId} onChange={e => setTestId(e.target.value)}/></label>
        <button type="button" onClick={newTest}>新建测试</button>
      </div>
      <div className='scene-info-nav'>
        <ul>
          {
            scenesList.length > 0 &&
            scenesList.map(scene => {
              const clsList = [];
              if (scene.active) {
                clsList.push('active')
              }
              if (scene.locked) {
                clsList.push('locked')
              }
              return (
                <li key={`scene-item-key-${scene.sceneId}`} className={clsList.join(' ')}
                    onClick={() => openScene(scene)}>
                  <div>
                    {
                      !!scene.finish &&
                      <svg className="icon" viewBox="0 0 1024 1024" version="1.1"
                           xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                        <path
                          d="M830.976 349.696l-389.12 389.12c-8.704 8.704-19.968 13.312-32.256 13.312s-23.552-4.608-32.256-13.312l-184.32-184.32c-17.92-17.92-17.92-46.592 0-64.512s46.592-17.92 64.512 0L409.6 642.048l356.864-356.864c17.92-17.92 46.592-17.92 64.512 0s17.92 46.592 0 64.512M512 0C229.376 0 0 229.376 0 512s229.376 512 512 512 512-229.376 512-512S794.624 0 512 0"
                          fill="#17935D"></path>
                      </svg>
                    }
                    {
                      !scene.finish && curInfo.current.sceneId === scene.sceneId &&
                      <svg className="icon" viewBox="0 0 1024 1024" version="1.1"
                           xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                        <path
                          d="M508.8 153.6A370.24 370.24 0 0 0 227.84 282.112c-25.6 29.568-46.528 63.168-61.76 99.648a44.8 44.8 0 1 1-82.688-34.56 460.928 460.928 0 0 1 76.672-123.712A459.84 459.84 0 0 1 508.8 64a461.312 461.312 0 0 1 420.48 272.128l56.32-23.36a16 16 0 0 1 21.76 18.496l-37.12 156.8a32 32 0 0 1-48 19.84l-137.152-84.608a16 16 0 0 1 2.304-28.416l59.072-24.448a371.584 371.584 0 0 0-56.768-88.32A370.24 370.24 0 0 0 508.736 153.6z m6.4 717.504a370.24 370.24 0 0 0 280.832-128.512c25.6-29.504 46.528-63.104 61.824-99.648a44.8 44.8 0 0 1 82.624 34.56 460.8 460.8 0 0 1-76.672 123.712 459.84 459.84 0 0 1-348.672 159.488 459.84 459.84 0 0 1-348.608-159.488 461.184 461.184 0 0 1-71.872-112.64l-56.32 23.36a16 16 0 0 1-21.76-18.432l37.12-156.8a32 32 0 0 1 48-19.904l137.152 84.608a16 16 0 0 1-2.304 28.416l-59.072 24.448c14.72 32.192 33.92 61.888 56.832 88.32a370.24 370.24 0 0 0 280.832 128.512z"
                          fill="#4097FD">
                          <animateTransform attributeName="transform" type="rotate"
                                            values="0 512 512;360 512 512"
                                            dur="3s" repeatCount="indefinite"></animateTransform>
                        </path>
                      </svg>
                    }
                    {
                      !scene.finish && curInfo.current.sceneId !== scene.sceneId &&
                      <svg className="icon" viewBox="0 0 1024 1024" version="1.1"
                           xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                        <path
                          d="M468.928 566.144h251.2c26.112 0 47.872 21.504 47.872 48 0 26.72-21.44 48-47.872 48h-288.256c-15.744 0-29.888-7.776-38.656-19.776a47.712 47.712 0 0 1-20.288-39.136V314.88c0-26.08 21.472-47.84 48-47.84 26.688 0 48 21.44 48 47.872v251.2zM0 512c0 282.784 229.184 512 512 512 282.784 0 512-229.184 512-512 0-282.784-229.184-512-512-512C229.216 0 0 229.184 0 512z"
                          fill="#F37938"></path>
                      </svg>
                    }
                    <span>{scene.sceneName}</span>
                  </div>
                </li>
              )
            })
          }
        </ul>
      </div>
      <div className='content-body'>
        {
          flowList.length > 0 &&
          flowList.map((flow, index) => {
            const clsList = ['flow-item']
            switch (flow.step) {
              case constant.flow_end:
                clsList.push('end');
                break;
              case constant.flow_wait:
                clsList.push('wait');
                break;
              case constant.flow_pause:
                clsList.push('pause');
                break;
              case constant.flow_active:
                clsList.push('active');
                break;
            }
            return (
              <div className={clsList.join(' ')} key={`flow-item-${flow.flowInfo.flowId}`}>
                <div className='process-bar'>
                  {
                    flow.step === constant.flow_wait &&
                    <svg className="icon" viewBox="0 0 1024 1024" version="1.1"
                         xmlns="http://www.w3.org/2000/svg" width="50" height="50">
                      <path
                        d="M468.928 566.144h251.2c26.112 0 47.872 21.504 47.872 48 0 26.72-21.44 48-47.872 48h-288.256c-15.744 0-29.888-7.776-38.656-19.776a47.712 47.712 0 0 1-20.288-39.136V314.88c0-26.08 21.472-47.84 48-47.84 26.688 0 48 21.44 48 47.872v251.2zM0 512c0 282.784 229.184 512 512 512 282.784 0 512-229.184 512-512 0-282.784-229.184-512-512-512C229.216 0 0 229.184 0 512z"
                        fill="#F37938"></path>
                    </svg>
                  }
                  {
                    flow.step === constant.flow_end &&
                    <svg className="icon" viewBox="0 0 1024 1024" version="1.1"
                         xmlns="http://www.w3.org/2000/svg" width="50" height="50">
                      <path
                        d="M830.976 349.696l-389.12 389.12c-8.704 8.704-19.968 13.312-32.256 13.312s-23.552-4.608-32.256-13.312l-184.32-184.32c-17.92-17.92-17.92-46.592 0-64.512s46.592-17.92 64.512 0L409.6 642.048l356.864-356.864c17.92-17.92 46.592-17.92 64.512 0s17.92 46.592 0 64.512M512 0C229.376 0 0 229.376 0 512s229.376 512 512 512 512-229.376 512-512S794.624 0 512 0"
                        fill="#17935D"></path>
                    </svg>
                  }
                  {
                    (flow.step === constant.flow_pause || flow.step === constant.flow_active) &&
                    <span>
                      <svg className='icon' viewBox="0 0 1036 1024" version="1.1"
                           xmlns="http://www.w3.org/2000/svg" width="50" height="50"><path
                        d="M511.144516 868.596627c-176.289052 0-322.915527-126.987183-353.409029-294.455335l-6.408967 1.281179c-3.793396-16.240893-16.951067-29.987988-35.346019-34.579563-26.28055-6.576789-53.234435 7.950066-60.276828 32.417317L4.750187 750.438531c-7.014764 24.439622 8.56405 49.608861 34.815947 56.158021 26.249851 6.54609 53.231365-7.982812 60.249199-32.420387l15.270798-53.103452C190.734042 862.317621 339.715145 958.400956 511.144516 958.400956c197.718107 0 365.571023-127.800711 425.492764-305.296241l-87.510076-21.877263C799.22977 769.635755 666.74641 868.596627 511.144516 868.596627zM985.122551 242.026242c-25.606191-6.956436-52.266387 7.219425-59.545164 31.659047L914.292366 311.528176C841.156672 162.761967 688.116113 60.375066 511.144516 60.375066c-199.51094 0-368.632755 130.128733-427.121867 310.140573l81.459267 40.73168c42.706661-150.673651 181.293019-261.069971 345.662601-261.069971 184.557366 0 336.598154 139.216715 356.880083 318.353628l3.095501-1.238201c1.677199 18.482957 15.036461 34.93158 34.840506 40.312124 25.637913 6.958482 52.297087-7.220449 59.575864-31.657001l52.765761-177.063695C1025.608637 274.414907 1010.760464 248.984724 985.122551 242.026242z"
                      >
                        {
                          flow.step === constant.flow_active && flow.loading &&
                          <animateTransform attributeName="transform" type="rotate"
                                            attributeType="XML"
                                            from="0 512 512"
                                            to="360 512 512"
                                            dur="2s"
                                            repeatCount="indefinite"/>
                        }
                      </path>
                      </svg>
                      {
                        flow.step === constant.flow_pause && waitTime > 0 &&
                        <span className='pause-time'>{waitTime}</span>
                      }
                    </span>
                  }
                </div>
                <RenderItem key={`flow-item-key-${flow.flowInfo.flowId}`} flow={flow}/>
              </div>
            )
          })
        }
      </div>
    </>
  )
}