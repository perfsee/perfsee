const { startServer } = require('./index')

startServer((err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
})
