var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// Define Todo schema 
var _Gift = new Schema({ 
    label : String, 
    id : String, 
    link: String,
    checked : Boolean,
    donor: String
});
var _Info = new Schema({
    user: String,
    name: String,
    address: String,
    phone: String
});
// export them 
exports.Gift = mongoose.model('Gift', _Gift);
exports.Info = mongoose.model('Info', _Info);