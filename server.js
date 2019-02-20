'use strict';

//Application Dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

//Load enviroment variables from .env file
require('dotenv').config();

// Aplication setup
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());


//route to location
app.get('/location', (request, response) => {
  searchToLatLong(request.query.data)
    .then(location => response.send(location))
    .catch(error => handleError(error, response));
});

//route to weather
app.get('/weather', getWeather);

// Route to meetup
app.get('/meetUp', (request, response) => {
  getMeetUp(request.query.data)
    .then(meetUp => response.send(meetUp))
    .catch(error => handleError(error, response));
});

// app.get('/meetUp', getMeetUp);

//***************** */
// Helper Functions
//***************** */

//Errror handler
function handleError(err, res){
  if (res) res.status(500).send('Sorry, there was an error');
}

// Location route handler
function searchToLatLong(query){
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GOOGLE_API}`;
  return superagent.get(url)
    .then(res => {
      return new Location(query, res);
    })
    .catch(error => handleError(error));
}

// Weather route handler
function getWeather(request, response){
  const url = `https://api.darksky.net/forecast/${process.env.DARKSKY_API}/${request.query.data.latitude},${request.query.data.longitude}`;

  superagent.get(url)
    .then(result => {
      const weatherSummaries = result.body.daily.data.map(day => {
        return new Weather(day);
      });
      response.send(weatherSummaries);
    })
    .catch(error => handleError(error, response));
}

//MeetUp route handler
function getMeetUp(request, response){
  const url = `https://api.meetup.com/find/events?lon=${request.query.data.longitude}&lat=${request.query.data.latitude}&key=${process.env.MEETUP_API}`;

  return superagent.get(url)
    .then(result => {
      const meetUpSummaries = result.body.data.map(obj => {
        return new MeetUp(obj);
      });
      response.send(meetUpSummaries);
    })
    .catch(error => handleError(error));
}

//**************** */
// Constructors
//**************** */

//location constructor
function Location(query, res) {
  this.search_query = query;
  this.formatted_query = res.body.results[0].formatted_address;
  this.latitude = res.body.results[0].geometry.location.lat;
  this.longitude = res.body.results[0].geometry.location.lng;
}

//forecast constructor
function Weather(day){
  this.forecast = day.summary;
  this.time = new Date(day.time*1000).toString().slice(0,15);
}

//meetup constructor
function MeetUp(res) {
  // this.search_query = query;
  this.link = res.body.link;
  this.name = res.body.name;
  this.creation_date = res.body.created;
  this.host = res.body.group.name;
}

app.use('*', (err, res) => handleError(err, res));

app.listen(PORT, () => console.log(`App is up on ${PORT}`));
