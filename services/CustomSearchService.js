const pg = require('../config/pg');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');
const env = require('../env.js');

const HttpService = require('../services/HttpService');


const CustomSearchService = {
  insertOne: async (phone, originId, destinationId, date) => {
    if(isNaN(destinationId)) {
      throw 'Destination id not provided'
    }

    if(isNaN(originId)) {
      throw 'Origin id not provided'
    }

    if(typeof phone !== 'string') {
      throw 'Phone not provided'
    }

    if(typeof date !== 'string') {
      throw 'Date not provided'
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')
      let q0 = "select * from stops where id = $1";

      result = await client.query(q0, [originId]);

      if(result == null || result.rows == null) {
        throw "Stops get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Origin not found"
      }

      let origin = result.rows[0];

      let q1 = "select * from stops where id = $1";

      result = await client.query(q1, [destinationId]);

      if(result == null || result.rows == null) {
        throw "Stops get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Destination not found"
      }

      let destination = result.rows[0];

      let q2 = "INSERT INTO custom_search_requests(phone, origin_id, destination_id, date) values($1, $2, $3, $4) returning *";

      result = await client.query(q2, [phone, originId, destinationId, date]);

      if(result == null || result.rows == null) {
        throw "Custom search insert did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Custom search insert did not return any result";
      }

      let customSearch = result.rows[0];

      var message = `New custom search request!\n\
          Request id: ${customSearch.id}\n\
          Phone: ${customSearch.phone}\n\
          Origin: ${origin.name}\n\
          Date: ${moment(date).local()}\n\
          Destination: ${destination.name}\n`;

      result = await HttpService.post(env.bot.host + '/send_message', {message: message});

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(customSearch);
      })
    } catch(e) {
      console.log(e);
      await client.query('ROLLBACK')
      res.render('error', { message : e.toString()});
    } finally {
      client.release()
    }
  }
}

module.exports = CustomSearchService;
