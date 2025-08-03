import ajax from "./ajax.js";
import user from "./user.js";

const baseUrl = `${import.meta.env.VITE_API_BASE}:${import.meta.env.VITE_API_PORT}`
const CHUNK_SIZE = 20 * 1024 * 1024; // 每片 xMB

export class FileUpload {

  #currentRequest;
  #cancel = false;
  #file;
  #$dom;

  constructor(file, $dom) {
    this.#file = file
    this.#$dom = $dom
  }

  #setAuthorization(xhr) {
    const userInfo =user.get()
    if(!!userInfo){
      xhr.setRequestHeader("Authorization", `Bearer ${userInfo.token}`);
    }
  }

  async upload() {
    this.#cancel = false
    const totalChunks = Math.ceil(this.#file.size / CHUNK_SIZE);
    let {currentChunk, uploadId} = await ajax.post('/file-upload/init', {totalChunks, fileName: this.#file.name, totalSize: this.#file.size})

    const $el = this.#$dom.getElementsByClassName('progress-bg')[0]
    while(currentChunk <= totalChunks) {
      if (this.#cancel) return 2;
      const start = currentChunk * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, this.#file.size);
      if(start >= end) {
        break;
      }
      const blob = this.#file.slice(start, end);

      const formData = new FormData();
      formData.append('file', blob);
      formData.append('fileId', uploadId);
      formData.append('currentChunk', currentChunk + "");
      formData.append('totalChunks', totalChunks + "");

      let res = await this.#uploadNextChunk(formData)
      if(res === 0) {
        return 1
      }
      const percent = Math.floor(((currentChunk + 1) / totalChunks) * 100);
      requestAnimationFrame(() => {
        $el.style.width = `${percent}%`
      })
      $el.nextSibling.innerText = `上传中...${percent}%`
      currentChunk++;
    }
    await ajax.post('/file-upload/finish', {fileId: uploadId})
    $el.nextSibling.innerText = '上传完成'
    return 0
  }

  #uploadNextChunk(formData) {
    let _this = this
    return new Promise(resolve => {

      const xhr = new XMLHttpRequest();
      _this.#currentRequest = xhr;

      let url = `${baseUrl}/file-upload/upload`
      xhr.open('POST', url, true);

      xhr.onload = function () {
        if (xhr.status === 200) {
          resolve(1)
        } else {
          console.error('上传失败', xhr.responseText);
          resolve(0)
        }
      };

      xhr.onerror = function () {
        console.error('网络错误');
        resolve(0)
      };
      _this.#setAuthorization(xhr)
      xhr.send(formData);
    })
  }

  cancelUpload() {
    this.#cancel = true
    if(this.#currentRequest) {
      this.#currentRequest.abort()
      console.log('上传已取消');
    }
  }

}