let modalId = 5000
export default {
  gId: function () {
    return new Date().getTime() + '';
  },
  modalId: () => {
    return ++modalId
  }
}


Array.prototype.remove = function (val) {
  for (let i = 0; i < this.length; i++) {
    if (this[i] === val) {
      this.splice(i, 1);
      i--;
    }
  }
}
