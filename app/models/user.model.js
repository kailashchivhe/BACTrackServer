const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const History = new Schema({
    measurement: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now()
    }
});

const User = new Schema({
    email: {
        type: String
    },
    password: {
        type: String
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    customerId:{
        type: String
    },
    history: [History],
});

module.exports = mongoose.model('BacTrackUser', User);