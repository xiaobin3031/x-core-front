/**
 * 按键监听
 * @param e
 * @param keyCode
 * @param callback
 * @param ctrl 是否按住功能键 'shift' | 'ctrl' | 'alt'
 */
function onKeyMatch(e, keyCode, callback, ctrl) {
  if (!callback) return;

  if (keyCode === e.keyCode) {
    if (!!ctrl) {
      let controller = false;
      switch (ctrl) {
        case 'ctrl':
          controller = e.ctrlKey;
          break;
        case 'alt':
          controller = e.altKey;
          break;
        case 'shift':
          controller = e.shiftKey;
          break;
      }
      if (!controller) return;
    }
    callback(e);
  }
}

export function onEnter(e, callback, ctrl) {
  onKeyMatch(e, 13, callback, ctrl)
}

export function onDelete(e, callback, ctrl) {
  onKeyMatch(e, 8, callback, ctrl)
}

export default {
  onEnter,
  onDelete
}
