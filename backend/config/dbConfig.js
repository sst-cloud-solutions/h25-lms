// db/main.js  (loaded once at boot)
const knex = require('knex');
const { main } = require('../knexfile'); // your config above

const mainDb = knex(main);     // ONE instance, ONE pool (min/max from config)
module.exports = { mainDb };