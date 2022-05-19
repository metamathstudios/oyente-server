
const isPromise = (p) => {
  if (typeof p === 'object' && typeof p.then === 'function') {
    return true
  }
  return false
}

module.exports = {
  isPromise
}
