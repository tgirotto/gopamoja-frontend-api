const pg = require('../config/pg');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');

const ImageService = {
  findByCompanyId: async (companyId) => {
    if(isNaN(companyId)) {
      throw "Company id invalid"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = "select * from images where company_id = $1";

      result = await client.query(q0, [companyId]);

      if(result == null || result.rows == null) {
        throw "Images get did not return any result";
      }

      let images = result.rows;

      await client.query('COMMIT')
      return new Promise((resolve, reject) => {
        resolve(images);
      });
    } catch(e) {
      console.log(e);
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }
}

module.exports = ImageService;
