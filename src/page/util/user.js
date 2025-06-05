let user;
export default {
  save: (userInfo) => {
    user = userInfo;
  },
  get: () => {
    return user;
  }
}