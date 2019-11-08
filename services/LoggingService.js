const pg = require('../config/pg');

const LoggingService = {
  logJourneyRequest: async (originId, destinationId, date, latitude, longitude) => {
    if(isNaN(originId)) {
      return;
    }

    if(isNaN(destinationId)) {
      return;
    }

    if(latitude == null) {
      latitude = 0;
    }

    if(longitude == null) {
      longitude = 0;
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = "insert into journey_requests \
        (origin_id, \
        destination_id, \
        date, \
        latitude, \
        longitude) values ($1, $2, $3, $4, $5)";

      result = await client.query(q0, [originId, destinationId, date, latitude, longitude]);

      if(result == null || result.rows == null) {
        throw "Logging insert did not return any result";
      }

      await client.query('COMMIT')
    } catch(e) {
      console.log(e);
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }
}

module.exports = LoggingService;
