const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Meeting Scheduler';
const DEFAULT_FROM_ADDRESS = process.env.EMAIL_FROM || 'sirc.meeting@actofit.com';

const resolvePosterPath = () => {
  const candidates = [];

  if (process.env.PROMOTION_POSTER_PATH) {
    candidates.push(path.resolve(process.env.PROMOTION_POSTER_PATH));
  }

  candidates.push(path.join(__dirname, '../public/promotionPoster.png'));
  candidates.push(path.join(__dirname, '../../meeting-scheduler/public/promotionPoster.png'));

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
};

const PROMOTION_POSTER_PATH = resolvePosterPath();

const getFromAddress = () => {
  const address = DEFAULT_FROM_ADDRESS || process.env.EMAIL_USER;
  if (address && address.includes('@')) {
    return `"${DEFAULT_FROM_NAME}" <${address}>`;
  }

  return process.env.EMAIL_USER;
};

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Check if promotion poster exists
const hasPromotionPoster = () => Boolean(PROMOTION_POSTER_PATH);

// Get promotion HTML section
const getPromotionSection = () => {
  if (!hasPromotionPoster()) {
    return {
      html: '',
      attachments: []
    };
  }

  const promotionCid = 'promotion-poster-image';
  const promotionHtml = `
    <div style="margin-top: 40px; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; text-align: center;">
      <h3 style="color: white; margin-bottom: 20px; font-size: 24px;">🎯 Quick Vital Scan Before Your Meeting!</h3>
      <img src="cid:${promotionCid}" alt="Promotion Poster" style="max-width: 100%; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.25); margin-bottom: 25px;" />
      <p style="color: white; margin-bottom: 25px; font-size: 16px; line-height: 1.6;">
        Take a quick 30-second vital scan to check your health metrics before the meeting. Scan your vitals on the go and share insights with your host in real time.
      </p>
      <a href="${process.env.VITAL_SCAN_URL || '#'}"
         style="display: inline-block; background: white; color: #667eea; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin-bottom: 20px;">
        Start Your Vital Scan →
      </a>
      <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin-top: 15px;">
        Monitor your heart rate, blood pressure, and more in seconds to make informed decisions ahead of your offline meeting.
      </p>
    </div>
  `;

  return {
    html: promotionHtml,
    attachments: [
      {
        filename: path.basename(PROMOTION_POSTER_PATH),
        path: PROMOTION_POSTER_PATH,
        cid: promotionCid
      }
    ]
  };
};

// Meeting invitation email template
const getMeetingInvitationTemplate = (meeting, promotionHtml) => {
  const meetingDate = new Date(meeting.date).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const timezoneDisplay = meeting.timezone ? ` (${meeting.timezone})` : '';

  const locationSummary = [meeting.venue, meeting.country].filter(Boolean).join(', ');

  const contacts = [
    { label: 'Company A', value: meeting.companyA },
    { label: 'Company B', value: meeting.companyB },
    { label: '1st Broker', value: meeting.broker1 },
    { label: '2nd Broker', value: meeting.broker2 },
    { label: 'Client Contact', value: meeting.clientContact }
  ].filter(contact => contact.value && (contact.value.name || contact.value.email));

  const contactRows = contacts.length ? contacts.map((contact, index) => `
                      <tr ${index % 2 === 0 ? 'style="background-color: #f9fafb;"' : ''}>
                        <td style="padding: 12px; font-weight: 600; color: #4b5563; width: 140px;">${contact.label}:</td>
                        <td style="padding: 12px; color: #1f2937;">
                          ${contact.value.name ? `<div style="font-weight: 600; font-size: 15px;">${contact.value.name}</div>` : ''}
                          ${contact.value.email ? `<div style="margin-top: 4px;"><a href="mailto:${contact.value.email}" style="color: #4f46e5; text-decoration: none;">${contact.value.email}</a></div>` : ''}
                          ${contact.value.phone ? `<div style="margin-top: 4px; color: #4b5563; font-size: 13px;">${contact.value.phone}</div>` : ''}
                        </td>
                      </tr>
    `).join('') : `
                      <tr>
                        <td colspan="2" style="padding: 16px; color: #6b7280; text-align: center; font-size: 14px;">
                          Contact details will be shared closer to the meeting date.
                        </td>
                      </tr>
    `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Meeting Invitation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">📅 Meeting Invitation</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">${meeting.title}</h2>
                  
                  ${meeting.description ? `<p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">${meeting.description}</p>` : ''}
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                    <strong>Quick summary:</strong> ${meetingDate} at ${meeting.time}${timezoneDisplay} ${locationSummary ? `in ${locationSummary}` : ''}.
                  </p>
                  
                  <!-- Meeting Details Box -->
                  <div style="background-color: #f9fafb; border-left: 4px solid #4f46e5; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #4b5563; font-weight: 600; width: 120px;">📅 Date:</td>
                        <td style="color: #1f2937; font-weight: 500;">${meetingDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #4b5563; font-weight: 600;">⏰ Time:</td>
                        <td style="color: #1f2937; font-weight: 500;">${meeting.time}${timezoneDisplay}</td>
                      </tr>
                      <tr>
                        <td style="color: #4b5563; font-weight: 600;">📍 Venue:</td>
                        <td style="color: #1f2937; font-weight: 500;">${meeting.venue}</td>
                      </tr>
                      ${meeting.country ? `
                      <tr>
                        <td style="color: #4b5563; font-weight: 600;">🌍 Country:</td>
                        <td style="color: #1f2937; font-weight: 500;">${meeting.country}</td>
                      </tr>
                      ` : ''}
                      ${meeting.location ? `
                      <tr>
                        <td style="color: #4b5563; font-weight: 600;">🏢 Location Code:</td>
                        <td style="color: #1f2937; font-weight: 500;">${meeting.location}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="color: #4b5563; font-weight: 600;">🗺️ Directions:</td>
                        <td style="color: #1f2937; font-weight: 500;">
                          Please plan to arrive 10 minutes early to account for security and check-in formalities.
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Participants -->
                  <div style="margin-bottom: 30px;">
                    <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 15px;">👥 Meeting Contacts</h3>
                    <table width="100%" cellpadding="8" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px;">
                      ${contactRows}
                    </table>
                  </div>

                  <!-- Important Notice -->
                  <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                      <strong>⚠️ Important:</strong> This is an <strong>offline meeting</strong>. Please bring a valid ID for building access and arrive at the venue on time.
                    </p>
                  </div>

                  ${promotionHtml}

                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                    This is an automated invitation from Meeting Scheduler
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    Please contact the meeting organizer if you have any questions
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Party joined notification template
const getPartyJoinedTemplate = (meeting, joinedParticipant) => {
  const meetingDate = new Date(meeting.date).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Party Joined Notification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🔔 Party Joined Notification</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                    <p style="color: #065f46; font-size: 18px; font-weight: 600; margin: 0;">
                      ${joinedParticipant.name} has joined the meeting!
                    </p>
                  </div>
                  
                  <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px;">${meeting.title}</h2>
                  
                  <!-- Meeting Details -->
                  <div style="background-color: #f9fafb; border-left: 4px solid #4f46e5; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #4b5563; font-weight: 600; width: 120px;">📅 Date:</td>
                        <td style="color: #1f2937; font-weight: 500;">${meetingDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #4b5563; font-weight: 600;">⏰ Time:</td>
                        <td style="color: #1f2937; font-weight: 500;">${meeting.time}</td>
                      </tr>
                      <tr>
                        <td style="color: #4b5563; font-weight: 600;">📍 Venue:</td>
                        <td style="color: #1f2937; font-weight: 500;">${meeting.venue}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    This is to notify you that <strong style="color: #1f2937;">${joinedParticipant.name}</strong> has arrived at the meeting venue. 
                    ${joinedParticipant.email ? `You can reach them at <a href="mailto:${joinedParticipant.email}" style="color: #4f46e5;">${joinedParticipant.email}</a>` : ''}
                  </p>
                  
                  <div style="background-color: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin-top: 30px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                      <strong>💡 Note:</strong> Please proceed to the venue if you haven't already.
                    </p>
                  </div>
                  
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                    This is an automated notification from Meeting Scheduler
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    Please contact the meeting organizer if you have any questions
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Send meeting invitation
const sendMeetingInvitation = async (meeting) => {
  const transporter = createTransporter();

  // Collect all recipients
  const recipients = [];

  if (meeting.companyA && meeting.companyA.email) {
    recipients.push({
      name: meeting.companyA.name,
      email: meeting.companyA.email
    });
  }

  if (meeting.companyB && meeting.companyB.email) {
    recipients.push({
      name: meeting.companyB.name,
      email: meeting.companyB.email
    });
  }

  if (meeting.broker1 && meeting.broker1.email) {
    recipients.push({
      name: meeting.broker1.name,
      email: meeting.broker1.email
    });
  }

  if (meeting.broker2 && meeting.broker2.email) {
    recipients.push({
      name: meeting.broker2.name,
      email: meeting.broker2.email
    });
  }

  if (meeting.clientContact && meeting.clientContact.email) {
    recipients.push({
      name: meeting.clientContact.name,
      email: meeting.clientContact.email
    });
  }

  const { html: promotionHtml, attachments: promotionAttachments } = getPromotionSection();
  const emailHTML = getMeetingInvitationTemplate(meeting, promotionHtml);
  const fromAddress = getFromAddress();

  // Send emails
  const emailPromises = recipients.map(recipient => {
    const attachments = promotionAttachments.map(attachment => ({ ...attachment }));
    return transporter.sendMail({
      from: fromAddress,
      to: recipient.email,
      subject: `Meeting Invitation: ${meeting.title}`,
      html: emailHTML,
      attachments
    });
  });

  try {
    await Promise.all(emailPromises);
    console.log(`✅ Invitations sent to ${recipients.length} recipients for meeting: ${meeting.title}`);
    return { success: true, count: recipients.length };
  } catch (error) {
    console.error('❌ Error sending invitations:', error);
    throw error;
  }
};

// Send party joined notification
const sendPartyJoinedNotification = async (meeting, joinedParticipant) => {
  const transporter = createTransporter();

  // Collect all recipients except the one who joined
  const recipients = [];

  if (meeting.companyA && meeting.companyA.email && meeting.companyA.email !== joinedParticipant.email) {
    recipients.push({
      name: meeting.companyA.name,
      email: meeting.companyA.email
    });
  }

  if (meeting.companyB && meeting.companyB.email && meeting.companyB.email !== joinedParticipant.email) {
    recipients.push({
      name: meeting.companyB.name,
      email: meeting.companyB.email
    });
  }

  if (meeting.broker1 && meeting.broker1.email && meeting.broker1.email !== joinedParticipant.email) {
    recipients.push({
      name: meeting.broker1.name,
      email: meeting.broker1.email
    });
  }

  if (meeting.broker2 && meeting.broker2.email && meeting.broker2.email !== joinedParticipant.email) {
    recipients.push({
      name: meeting.broker2.name,
      email: meeting.broker2.email
    });
  }

  if (meeting.clientContact && meeting.clientContact.email && meeting.clientContact.email !== joinedParticipant.email) {
    recipients.push({
      name: meeting.clientContact.name,
      email: meeting.clientContact.email
    });
  }

  const emailHTML = getPartyJoinedTemplate(meeting, joinedParticipant);
  const fromAddress = getFromAddress();

  // Send emails
  const emailPromises = recipients.map(recipient => {
    return transporter.sendMail({
      from: fromAddress,
      to: recipient.email,
      subject: `${joinedParticipant.name} has joined: ${meeting.title}`,
      html: emailHTML
    });
  });

  try {
    await Promise.all(emailPromises);
    console.log(`✅ Party joined notifications sent to ${recipients.length} recipients`);
    return { success: true, count: recipients.length };
  } catch (error) {
    console.error('❌ Error sending party joined notifications:', error);
    throw error;
  }
};

module.exports = {
  sendMeetingInvitation,
  sendPartyJoinedNotification
};