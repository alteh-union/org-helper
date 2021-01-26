export function authHeader() {
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
        return { Authorization: `Bearer ${jwt}` };
    } else {
        return {};
    }
}
