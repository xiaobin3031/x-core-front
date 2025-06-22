let user;
export default {
  save: (userInfo) => {
    user = userInfo;
  },
  get: () => {
    return user;
  },
  loginToken: () => {
    return !!user && user.token || void 0;
  }
}