let user;
export default {
    save: (userInfo) => {
        user = userInfo;
    },
    get: () => {
        return user;
    },
    isLogin: () => {
        return !!user && !!user.token;
    },
    loginToken: () => {
        return !!user && user.token || void 0;
    }
}