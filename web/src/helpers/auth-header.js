export function getAuthHeader() {
  const user = getCurrentUser();
    return user ? { Authorization: `Bearer ${user.token}` } : {};
}

export function getCurrentUser() {
  const userJson = localStorage.getItem('user');
  if (!userJson) return null;
  return JSON.parse(userJson);
}
