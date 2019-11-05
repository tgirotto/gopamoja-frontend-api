const pg = require('../config/pg');
const Router = require('express-promise-router');
const router = new Router()
let moment = require('moment');

const StopService = require('../services/StopService');
const SegmentService = require('../services/SegmentService');
const LoggingService = require('../services/LoggingService');
const TicketRequestService = require('../services/TicketRequestService');
const CustomSearchService = require('../services/CustomSearchService');

let ENVIRONMENT = process.env.ENVIRONMENT || 'development';

router.get('/origins', async function(req, res, next) {
  try {
    const origins = await StopService.findAll();
    const topOrigins = await StopService.findByPopular(true);

    res.json({
      origins: origins,
      popular_origins: topOrigins
    })
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

router.get('/destinations', async function(req, res, next) {
  try {
    const destinations = await StopService.findAll();
    const topDestinations = await StopService.findByPopular(true);

    res.json({
      destinations: destinations,
      popular_destinations: topDestinations
    })
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

router.get('/journeys', async function(req, res, next) {
  let originId = parseInt(req.query.origin_id);
  let destinationId = parseInt(req.query.destination_id);
  let date = req.query.date;
  let latitude = parseFloat(req.query.latitude);
  let longitude = parseFloat(req.query.longitude);

  if(isNaN(originId)) {
    res.status(500).json({err: "Invalid origin"});
    return
  }

  if(isNaN(destinationId)) {
    res.status(500).json({err: "Invalid destination"});
    return
  }

  if(typeof date !== 'string') {
    res.status(500).json({err: "Invalid date"});
    return
  }

  if(isNaN(latitude)) {
    latitude = 0;
  }

  if(isNaN(longitude)) {
    longitude = 0;
  }

  try {
    const d = moment(date);
    const result = await SegmentService.findByOriginIdAndDestinationIdAndDate(originId, destinationId, date);
    res.json(result)

    LoggingService.logJourneyRequest(originId, destinationId, date, latitude, longitude);
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

router.post('/ticket_request', async function(req, res, next) {
  let segmentId = parseInt(req.body.segment_id);
  let firstName = req.body.first_name;
  let lastName = req.body.last_name;
  let phone = req.body.phone;
  let date = req.body.date;
  let promo = req.body.promo || '';

  if(isNaN(segmentId)) {
    res.status(500).json({err: 'Segment id not provided'});
    return
  }

  if(typeof firstName !== 'string') {
    res.status(500).json({err: 'First name not provided'});
    return
  }

  if(typeof lastName !== 'string') {
    res.status(500).json({err: 'Last name not provided'});
    return
  }

  if(typeof phone !== 'string') {
    res.status(500).json({err: 'Phone not provided'});
    return
  }

  if(typeof date !== 'string') {
    res.status(500).json({err: 'Date not provided'});
    return
  }

  if(typeof promo !== 'string') {
    res.status(500).json({err: 'Promo invalid'});
    return
  }

  try {
    const result = await TicketRequestService.insertOne(segmentId, date, firstName, lastName, phone, promo);
    res.json(result);
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

router.post('/custom_search_request', async function(req, res, next) {
  let destinationId = parseInt(req.body.destination_id);
  let originId = parseInt(req.body.origin_id);
  let phone = req.body.phone;
  let date = req.body.date;

  if(isNaN(destinationId)) {
    res.json({err: 'Destination id not provided'});
    return
  }

  if(isNaN(originId)) {
    res.json({err: 'Origin id not provided'});
    return
  }

  if(typeof phone !== 'string') {
    res.json({err: 'Phone not provided'});
    return
  }

  if(typeof date !== 'string') {
    res.json({err: 'Date not provided'});
    return
  }

  try {
    const customSearch = await CustomSearchService.insertOne(phone, originId, destinationId, date);
    res.json({
      custom_search: customSearch
    });
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

router.get('/offline', function(req, res, next) {
  res.render('offline', {});
});

module.exports = router;
