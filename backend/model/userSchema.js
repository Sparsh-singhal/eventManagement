const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    "username": {type:String, unique:true},
    "fullName": {type:String},
    "email" : {type:String},
    "phone" : {type:String},
    "password": {type:String},
    "role": {type:String, enum:['admin', 'organizer', 'attendee'], default:'attendee'},
    "bookedEvents": {type:Array},
    "favorites": [{type: mongoose.Schema.Types.ObjectId, ref: 'eventSchema'}],
    

}, {
    collection: "userrecord"
})

module.exports = mongoose.model("userSchema", userSchema);