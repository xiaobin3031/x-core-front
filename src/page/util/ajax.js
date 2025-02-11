const defaultAjax6Option = {
  type: 'POST',
  // contentType: 'application/x-www-form-urlencoded;charset=utf-8'
  header: {
    'Content-Type': 'application/json;charset=utf-8'
  }
};
const baseUrl = "http://127.0.0.1:6547"

function get(path, data = {}, options = {}){
  return ajax6(path, data, {type: 'get', ...options});
}
function post(path, data = {}, options = {}){
  return ajax6(path, data, {type: 'post', ...options});
}
function ajax6(path, data = {}, options={}){
  return new Promise((resolve, reject) => {
    options = {...defaultAjax6Option, ...options}
    const xhr = new XMLHttpRequest();
    if(!options.type){
      options.type = 'post';
    }
    let url = `${baseUrl}${path}`;
    if (options.type.toLowerCase() === 'get') {
      const query = formatParams(data);
      if(!!query){
        url += `?${query}`;
      }
      xhr.open(options.type, url, true);
      xhr.send(null);
    } else if (options.type.toLowerCase() === 'post') {
      xhr.open(options.type, url, true);
      Object.keys(options.header || {}).forEach(k => xhr.setRequestHeader(k, options.header[k]));
      xhr.send(JSON.stringify(data));
    }
    xhr.onload = () => {
      if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.response || '{}'));
      } else {
        reject(JSON.parse(xhr.response || '{}'));
      }
    }
  });
}

function ajax6File(path, fileData = {}){
  return new Promise((resolve, reject) => {
    if(Object.keys(fileData).length === 0){
      reject({});
    }else{
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

function formatParams(data = {}){
  return Object.keys(data).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(JSON.stringify(data[k]))}`).join('&');
}

export default {
  ajax6,
  get,
  post,
  ajax6File
}