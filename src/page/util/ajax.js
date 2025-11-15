import user from "./user.js";
import message from "../components/Message.jsx";
const defaultAjax6Option = {
  type: 'POST',
  // contentType: 'application/x-www-form-urlencoded;charset=utf-8'
  header: {
    'Content-Type': 'application/json;charset=utf-8'
  }
};
const baseUrl = `${import.meta.env.VITE_API_BASE}:${import.meta.env.VITE_API_PORT}`
const notLoginUrl = ['/login'];

function get(path, data = {}, options = {}) {
  return ajax6(path, data, {type: 'get', ...options});
}

function post(path, data = {}, options = {}) {
  return ajax6(path, data, {type: 'post', ...options});
}

function downloadFile(path) {
  window.open(baseUrl + path)
}

function uploadFile(path, file, progressCb, data = {}, options = {}) {
  return new Promise((resolve, reject) => {
    options = {...defaultAjax6Option, ...options}
    const xhr = new XMLHttpRequest();
    options.type = 'post';
    const formData = new FormData();
    formData.append('file', file)
    formData.append('filename', file.name)
    xhr.upload.onprogress = (event) => {
      if(event.lengthComputable) {
        const percentComplete = Math.round(event.loaded / event.total * 100)
        progressCb({percent: percentComplete})
      }
    }
    let url = `${baseUrl}${path}`;
    xhr.onload = () => {
      const res = JSON.parse(xhr.response || '{}')
      if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300 && res.code === 0) {
        if (res.code === 0) {
          resolve(res.data)
          return
        } else {
          message.error({msg: res.msg})
        }
      }
      reject(res)
    }
    xhr.open(options.type, url, true)
    setAuthorization(xhr)
    xhr.send(formData);
  });
}

function setAuthorization(xhr) {
  const userInfo =user.get()
  if(!!userInfo){
    xhr.setRequestHeader("Authorization", `Bearer ${userInfo.token}`);
  }
}

function ajax6(path, data = {}, options = {}) {
  return new Promise((resolve, reject) => {
    const userInfo =user.get()
    if(!userInfo && notLoginUrl.indexOf(path) === -1) {
      message.error({msg: 'not login'})
      reject()
      return
    }
    options = {...defaultAjax6Option, ...options}
    const xhr = new XMLHttpRequest();
    if (!options.type) {
      options.type = 'post';
    }
    if(!!options.responseType) {
      xhr.responseType = options.responseType;
    }
    let url = `${baseUrl}${path}`;
    if (options.type.toLowerCase() === 'get') {
      const query = formatParams(data);
      if (!!query) {
        url += `?${query}`;
      }
      xhr.open(options.type, url, true);
      setAuthorization(xhr)
      xhr.send(null);
    } else if (options.type.toLowerCase() === 'post') {
      xhr.open(options.type, url, true);
      setAuthorization(xhr)
      Object.keys(options.header || {}).forEach(k => xhr.setRequestHeader(k, options.header[k]));
      xhr.send(JSON.stringify(data));
    }
    xhr.onload = () => {
      if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
        if(options.responseType === 'blob'){
          resolve(xhr.response)
          return
        }
        const res = JSON.parse(xhr.response || '{}')
        if (res.code === 0) {
          resolve(res.data)
        } else {
          // todo 显示错误
          window.alert(res.msg)
          reject(res)
        }
      }else{
        reject("网络错误")
      }
    }
  });
}

function formatParams(data = {}) {
  return Object.keys(data).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(JSON.stringify(data[k]))}`).join('&');
}

export default {
  get,
  post,
  uploadFile,
  downloadFile,
  getBaseUrl: () => {
    return `${baseUrl}`
  }
}
