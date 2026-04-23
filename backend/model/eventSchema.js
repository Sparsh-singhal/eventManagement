const { Int32, Timestamp } = require("mongodb");
const mongoose = require("mongoose");
const eventSchema = new mongoose.Schema({
    "name": {type:String, unique:true},
    "date": {type:Date},
    "startTime": {type: String},
    "endTime": {type:String},
    "place": {type:String},
    "club": {type:String},
    "description": {type:String},
    "slots": {type: Number},
    "imageUrl": {type: String, default: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000'},
    "category": {type: String, default: 'General'},
    "tags": [{type: String}],
    "status": {type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming'},
    "organizerId": {type: mongoose.Schema.Types.ObjectId, ref: 'userSchema'},
    "registeredUsers" : {type:Array},
    

}, {
    collection: "events-record"
})

module.exports = mongoose.model("eventSchema", eventSchema);