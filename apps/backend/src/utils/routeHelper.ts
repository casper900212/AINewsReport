export const sendOk = (payload?: any) => {
  if (!payload) {
    return { status: 'Success' }
  }
  return {
    status: 'Success',
    ...payload,
  }
}
