const pg = require('../config/pg');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');
const env = require('../env.js');

const HttpService = require('../services/HttpService');
const TransactionService = require('../services/TransactionService');

const TicketRequestService = {
  insertOne: async (segmentId, date, firstName, lastName, phone, promo) => {
    if(isNaN(segmentId)) {
      throw 'Segment id not provided'
    }

    if(typeof firstName !== 'string') {
      throw 'First name not provided'
    }

    if(typeof lastName !== 'string') {
      throw 'Last name not provided'
    }

    if(typeof phone !== 'string') {
      throw 'Phone not provided'
    }

    if(typeof promo !== 'string') {
      throw 'Promo invalid'
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = "SELECT \
        segments.id as segment_id, \
        segments.price as price, \
        segments.origin_id as origin_id, \
        origins.name as origin_name, \
        destinations.name as destination_name, \
        segments.departure_day as departure_day, \
        segments.departure_hour as departure_hour, \
        segments.departure_minute as departure_minute, \
        segments.route_id as route_id, \
        companies.id as company_id, \
        companies.name as company_name, \
        trips.days_of_the_week as days_of_the_week \
        from routes \
        left join trips on trips.route_id = routes.id \
        left join segments on segments.route_id = routes.id \
        left join stops as origins on origins.id = segments.origin_id \
        left join stops as destinations on destinations.id = segments.destination_id \
        left join companies on routes.company_id = companies.id \
        where segments.id = $1";

      result = await client.query(q0, [segmentId]);

      if(result == null || result.rows == null) {
        throw "Journey read did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Journey read did not return any result";
      }

      let segment = result.rows[0];

      let startDate = moment().subtract(1, 'hours');

      let referenceNumber;
      let q2 = "SELECT * FROM ticket_requests where created > $1 and reference_number = $2";
      do {
        referenceNumber = TransactionService.generateReferenceNumber(5);

        result = await client.query(q2, [startDate, referenceNumber]);

        if(result == null || result.rows == null) {
          throw "Ticket request insert did not return any result";
        }

        if(result.rows.length < 1) {
          break;
        }
      } while(true)

      let serviceCharge = TransactionService.calculateServiceCharge(segment.price);

      let q1 = "INSERT INTO ticket_requests(first_name, last_name, phone, segment_id, promo, reference_number, amount, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;";

      result = await client.query(q1, [firstName, lastName, phone, segmentId, promo, referenceNumber, segment.price + serviceCharge, date]);

      if(result == null || result.rows == null) {
        throw "Ticket request insert did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Ticket request insert did not return any rows";
      }

      let ticketRequest = result.rows[0];

      let t = moment(date);
      t.set({hour:segment.departure_hour,minute:segment.departure_minute,second:0,millisecond:0})
      segment['formatted_departure'] = t.format("hh:mm A");
      segment['formatted_departure_date'] = t.format("MMM DD YYYY")

      t = moment(date);
      t.set({hour:segment.departure_hour,minute:segment.departure_minute,second:0,millisecond:0})
      segment['formatted_arrival'] = t.format("hh:mm A");
      segment['formatted_arrival_date'] = t.format("MMM DD YYYY")

      var message = `New ticket request!\n\
          Request id: ${ticketRequest.id}\n\
          First name: ${firstName}\n\
          Last name: ${lastName}\n\
          Phone: ${phone}\n\
          Company: ${segment.company_name}\n\
          Date: ${segment.formatted_departure_date}\n\
          Departure time: ${segment.formatted_departure}\n\
          Arrival time: ${segment.formatted_arrival}\n\
          Origin: ${segment.origin_name}\n\
          Destination: ${segment.destination_name}\n\
          Reference number: ${ticketRequest.reference_number}\n\
          Price: ${segment.price}\n\
          Service charge: ${serviceCharge}`;

      try {
        await HttpService.post(env.bot.host + '/send_message', {message: message});
      } catch(e) {
        console.log(e);
      }

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve({
          ticket_request: ticketRequest,
          journey: segment,
          service_charge: serviceCharge
        });
      })
    } catch(e) {
      console.log(e);
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }
}

module.exports = TicketRequestService;
