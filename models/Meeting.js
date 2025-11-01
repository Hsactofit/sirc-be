const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false,
        trim: true
    },
    email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: false,
        trim: true
    }
}, { _id: false });

const meetingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    venue: {
        type: String,
        required: true,
        trim: true
    },
    country: {
        type: String,
        trim: true
    },
    location: {
        type: String,
        enum: ['SG', 'MUM', ''],
        default: ''
    },
    companyA: {
        type: participantSchema,
        required: true
    },
    companyB: {
        type: participantSchema,
        required: true
    },
    broker1: {
        type: participantSchema,
        default: {}
    },
    broker2: {
        type: participantSchema,
        default: {}
    },
    clientContact: {
        type: participantSchema,
        default: {}
    },
    statusCompanyA: {
        type: String,
        trim: true
    },
    statusCompanyB: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    invitationsSent: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Index for better query performance
meetingSchema.index({ date: 1, time: 1 });
meetingSchema.index({ 'companyA.email': 1 });
meetingSchema.index({ 'companyB.email': 1 });

module.exports = mongoose.model('Meeting', meetingSchema);