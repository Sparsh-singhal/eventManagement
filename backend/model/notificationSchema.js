const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    "userId": { type: mongoose.Schema.Types.ObjectId, ref: 'userSchema', required: true },
    "message": { type: String, required: true },
    "readStatus": { type: Boolean, default: false },
    "createdAt": { type: Date, default: Date.now }
}, {
    collection: "notifications"
});

module.exports = mongoose.model("notificationSchema", notificationSchema);
