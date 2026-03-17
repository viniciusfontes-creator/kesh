export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (typeof process.removeAllListeners === 'function') {
      process.removeAllListeners('warning')
      process.on('warning', (warning) => {
        if ((warning as NodeJS.ErrnoException).code === 'DEP0169') {
          return
        }
      })
    }
  }
}
