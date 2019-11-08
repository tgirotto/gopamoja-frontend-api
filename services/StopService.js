const pg = require('../config/pg');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');

const RouteService = {
  findAll: async () => {
    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = "select stops.name, stops.id as id from stops \
               left join segments as origins on stops.id = origins.origin_id \
               left join routes as route_origins on route_origins.id = origins.route_id \
               group by stops.id, stops.name order by stops.name asc;";

      result = await client.query(q0);

      if(result == null || result.rows == null) {
        throw "Stops get did not return any result";
      }

      let origins = result.rows;

      await client.query('COMMIT')
      return new Promise((resolve, reject) => {
        resolve(origins);
      });
    } catch(e) {
      console.log(e);
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  },
  findByPopular: async (popular) => {
    if(typeof popular !== 'boolean') {
      throw "Popular is not a boolean"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = "select * from stops where popular = $1";

      result = await client.query(q0, [popular]);

      if(result == null || result.rows == null) {
        throw "Popular stops get did not return any result";
      }

      let topOrigins = result.rows;

      await client.query('COMMIT')
      return new Promise((resolve, reject) => {
        resolve(topOrigins);
      });
    } catch(e) {
      console.log(e);
      await client.query('ROLLBACK')
      res.status(500).json({e: e.toString()});
    } finally {
      client.release()
    }
  }
}

module.exports = RouteService;
