// Silence console output unless VITE_DEBUG is set to 'true'
const DEBUG = import.meta.env.VITE_DEBUG === 'true'

if (!DEBUG && typeof window !== 'undefined' && typeof console !== 'undefined') {
  ['log', 'info', 'debug', 'warn', 'error'].forEach(fn => {
    try {
      console[fn] = () => {}
    } catch (e) {
      // ignore
    }
  })
}

export default null
