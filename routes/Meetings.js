const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Meeting = require('../models/Meeting');
const auth = require('../middleware/auth');
const { sendMeetingInvitation, sendPartyJoinedNotification } = require('../utils/emailService');

// Configure multer for CSV upload
const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

// @route   GET /api/meetings/stats
// @desc    Get meeting statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
    try {
        const now = new Date();

        const totalMeetings = await Meeting.countDocuments();
        const upcomingMeetings = await Meeting.countDocuments({
            date: { $gte: now },
            status: 'scheduled'
        });
        const completedMeetings = await Meeting.countDocuments({
            status: 'completed'
        });

        res.json({
            totalMeetings,
            upcomingMeetings,
            completedMeetings
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Server error fetching statistics' });
    }
});

// @route   GET /api/meetings
// @desc    Get all meetings
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const meetings = await Meeting.find()
            .sort({ date: -1, time: -1 })
            .lean();

        res.json(meetings);
    } catch (error) {
        console.error('Error fetching meetings:', error);
        res.status(500).json({ message: 'Server error fetching meetings' });
    }
});

// @route   GET /api/meetings/:id
// @desc    Get single meeting
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        res.json(meeting);
    } catch (error) {
        console.error('Error fetching meeting:', error);
        res.status(500).json({ message: 'Server error fetching meeting' });
    }
});

// @route   POST /api/meetings
// @desc    Create new meeting
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const meetingData = {
            ...req.body,
            createdBy: req.user._id
        };

        const meeting = new Meeting(meetingData);
        await meeting.save();

        // Send email invitations
        try {
            await sendMeetingInvitation(meeting);
            meeting.invitationsSent = true;
            await meeting.save();
        } catch (emailError) {
            console.error('Error sending invitations:', emailError);
            // Meeting is still created, just log the email error
        }

        res.status(201).json(meeting);
    } catch (error) {
        console.error('Error creating meeting:', error);
        res.status(500).json({ message: 'Server error creating meeting', error: error.message });
    }
});

// @route   PUT /api/meetings/:id
// @desc    Update meeting
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        // Update meeting
        Object.assign(meeting, req.body);
        await meeting.save();

        // Send updated invitations
        try {
            await sendMeetingInvitation(meeting);
        } catch (emailError) {
            console.error('Error sending updated invitations:', emailError);
        }

        res.json(meeting);
    } catch (error) {
        console.error('Error updating meeting:', error);
        res.status(500).json({ message: 'Server error updating meeting' });
    }
});

// @route   DELETE /api/meetings/:id
// @desc    Delete meeting
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        await meeting.deleteOne();

        res.json({ message: 'Meeting deleted successfully' });
    } catch (error) {
        console.error('Error deleting meeting:', error);
        res.status(500).json({ message: 'Server error deleting meeting' });
    }
});

// @route   POST /api/meetings/:id/party-joined
// @desc    Send notification when a party joins
// @access  Private
router.post('/:id/party-joined', auth, async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        const { joinedParticipant } = req.body;

        if (!joinedParticipant || !joinedParticipant.name) {
            return res.status(400).json({ message: 'Joined participant information is required' });
        }

        // Send notification
        await sendPartyJoinedNotification(meeting, joinedParticipant);

        res.json({ message: 'Notification sent successfully' });
    } catch (error) {
        console.error('Error sending party joined notification:', error);
        res.status(500).json({ message: 'Server error sending notification' });
    }
});

// @route   POST /api/meetings/bulk-upload
// @desc    Bulk upload meetings from CSV
// @access  Private
router.post('/bulk-upload', auth, upload.single('csvFile'), async (req, res) => {
    let filePath = null;

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a CSV file' });
        }

        filePath = req.file.path;
        const results = [];
        const errors = [];

        // Read and parse CSV
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        if (results.length === 0) {
            return res.status(400).json({ message: 'CSV file is empty' });
        }

        // Process each row
        let successCount = 0;
        let failedCount = 0;

        for (let i = 0; i < results.length; i++) {
            const row = results[i];

            try {
                // Parse CSV data
                const meetingData = {
                    title: `Meeting: ${row['CEDANT / COMPANY A']} - ${row['REINSURER / COMPANY B']}`,
                    description: `Meeting between ${row['CEDANT / COMPANY A']} and ${row['REINSURER / COMPANY B']}`,
                    date: new Date(), // You can modify this to parse date from CSV if available
                    time: row['TIME'] || '10:00 AM',
                    venue: row['VENUE'] || 'TBD',
                    country: row['country'] || '',
                    location: row['SG/MUM'] || '',
                    companyA: {
                        name: row['CEDANT / COMPANY A'] || '',
                        email: row['CEDANT / COMPANY A Email'] || '',
                        phone: row['CEDANT / COMPANY A Phone'] || ''
                    },
                    companyB: {
                        name: row['REINSURER / COMPANY B'] || '',
                        email: row['REINSURER / COMPANY B Email'] || '',
                        phone: row['REINSURER / COMPANY B Phone'] || ''
                    },
                    broker1: {
                        name: row['1st Broker'] || '',
                        email: row['1st Broker Email'] || '',
                        phone: row['1st Broker Phone'] || ''
                    },
                    broker2: {
                        name: row['2nd Broker'] || '',
                        email: row['2nd Broker Email'] || '',
                        phone: row['2nd Broker Phone'] || ''
                    },
                    clientContact: {
                        name: row["CLIENT's CONTACT"] || '',
                        email: row["CLIENT's CONTACT Email"] || '',
                        phone: row["CLIENT's CONTACT Phone"] || ''
                    },
                    statusCompanyA: row['STATUS (Company A)'] || '',
                    statusCompanyB: row['STATUS (Company B)'] || '',
                    createdBy: req.user._id
                };

                // Validate required fields
                if (!meetingData.companyA.name || !meetingData.companyB.name || !meetingData.venue) {
                    errors.push({
                        row: i + 2, // +2 because of header row and 0-based index
                        error: 'Missing required fields (Company A, Company B, or Venue)'
                    });
                    failedCount++;
                    continue;
                }

                // Create meeting
                const meeting = new Meeting(meetingData);
                await meeting.save();

                // Send invitations
                try {
                    await sendMeetingInvitation(meeting);
                    meeting.invitationsSent = true;
                    await meeting.save();
                } catch (emailError) {
                    console.error(`Error sending invitations for row ${i + 2}:`, emailError);
                }

                successCount++;
            } catch (error) {
                console.error(`Error processing row ${i + 2}:`, error);
                errors.push({
                    row: i + 2,
                    error: error.message
                });
                failedCount++;
            }
        }

        res.json({
            message: `Bulk upload completed. ${successCount} meetings created, ${failedCount} failed`,
            totalRows: results.length,
            successCount,
            failedCount,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Error in bulk upload:', error);
        res.status(500).json({ message: 'Server error during bulk upload', error: error.message });
    } finally {
        // Clean up uploaded file
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
});

module.exports = router;