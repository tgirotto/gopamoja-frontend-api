const pg = require('pg');
const { Pool, Client } = pg;
const env = require('../env.js');

// var types = pg.types;
// types.setTypeParser(1114, function(stringValue) {
//   return stringValue;
// });

const client = new Pool(env.pg)

client
  .connect()
  .then(client => {
    console.log('connected to DB!');
  })
  .catch(error => {
    console.log(error);
  })



module.exports = client;
