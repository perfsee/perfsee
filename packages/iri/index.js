const { loadBinding } = require('@node-rs/helper')

module.exports =
  process.env.NODE_ENV === 'development'
    ? loadBinding(__dirname, 'iri', '@perfsee/iri')
    : require(/* webpackIgnore: true */ '@perfsee/iri-linux-x64-gnu')
