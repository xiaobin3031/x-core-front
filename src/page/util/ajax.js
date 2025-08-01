import user from "./user.js";
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

function mediaPlay(path, data= {}, options={}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // 可选：带上 token 鉴权
    options = {...defaultAjax6Option, ...options}
    xhr.open(options.type, path, true);
    xhr.responseType = "blob"; // 关键：处理媒体文件
    Object.keys(options.header || {}).forEach(k => xhr.setRequestHeader(k, options.header[k]));
    setAuthorization(xhr)

    xhr.onload = function () {
      if (xhr.status === 200 || xhr.status === 206) {
        resolve(xhr.response)
      } else {
        reject()
      }
    };
    xhr.send(JSON.stringify(data));
  });
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
          // todo 显示错误
          window.alert(res.msg)
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
      console.log('not login')
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

function ajax6File(path, fileData = {}) {
  return new Promise((resolve, reject) => {
    if (Object.keys(fileData).length === 0) {
      reject({});
    } else {
      const url = `${baseUrl}${path}`;
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      const formData = new FormData();
      Object.keys(fileData).forEach(k => formData.append(k, fileData[k]));
      // xhr.setRequestHeader("Content-Type", "multipart/form-data");
      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.response || '{}'));
        } else {
          reject(JSON.parse(xhr.response || '{}'));
        }
      }
      xhr.send(formData);
    }
  })
}

function formatParams(data = {}) {
  return Object.keys(data).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(JSON.stringify(data[k]))}`).join('&');
}

export default {
  ajax6,
  get,
  post,
  ajax6File,
  uploadFile,
  downloadFile,
  mediaPlay
}
