var mongoose = require('mongoose');
//var bcrypt = require('bcrypt-nodejs');
//var crypto = require('crypto');

var Mnemonik = new mongoose.Schema({
  type: String,
  link: String
});

var infoSchema = new mongoose.Schema({
  year: { type: String, lowercase: true }, //more like answer now
  
  name: String,
  text: String,
  image: String,
  
  chapter: String,
  
  bought: { type: Boolean, default: false },
  
  mnemoniks: [Mnemonik],
  
  ignored: { type: Boolean, default: false } ///TODO: universal ignore
});

module.exports = mongoose.model('Info', infoSchema);
