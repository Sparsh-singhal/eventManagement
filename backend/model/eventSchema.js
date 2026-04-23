const { Int32, Timestamp } = require("mongodb");
const mongoose = require("mongoose");
const eventSchema = new mongoose.Schema({
    "name": {type:String, unique:true},
    "date": {type:Date},
    "startTime": {type: String},
    "endTime": {type:String},
    "place": {type:String},
    "locationDetails": {
        "address": String,
        "lat": Number,
        "lng": Number
    },
    "club": {type:String},
    "description": {type:String},
    "slots": {type: Number}, // Maintained for backward compatibility, but we enforce capacity
    "capacity": {type: Number},
    "imageUrl": {type: String, default: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000'},
    "category": {type: String, default: 'General'},
    "tags": [{type: String}],
    "status": {type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming'},
    "organizerId": {type: mongoose.Schema.Types.ObjectId, ref: 'userSchema'},
    "registeredUsers" : {type:Array},
    "waitlist": [{
        "username": String,
        "fullName": String,
        "userId": {type: mongoose.Schema.Types.ObjectId, ref: 'userSchema'}
    }]
}, {
    collection: "events-record"
});

// Pre-save hook to ensure date is not in the past
eventSchema.pre('save', function(next) {
    if (this.isModified('date') || this.isNew) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDate = new Date(this.date);
        eventDate.setHours(0, 0, 0, 0);

        if (eventDate < today) {
            return next(new Error('Event date cannot be in the past'));
        }
    }
    next();
});

module.exports = mongoose.model("eventSchema", eventSchema);