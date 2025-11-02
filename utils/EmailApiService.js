const axios = require('axios');

class EmailApiService {
    // Static configuration
    static emailConfig = {
        apiUrl: process.env.EMAIL_SERVICE_URL,
        defaultCredentials: {
            service: "gmail",
            user: process.env.EMAIL_USER,
            password: process.env.EMAIL_PASSWORD
        },
        defaultFrom: process.env.EMAIL_FROM,
        timeout: 30000 // 30 seconds timeout
    };

    /**
     * Static method to send emails via Azure Function API
     * @param {Object} emailData - Email configuration
     * @returns {Promise<Object>} - API response
     */
    static async sendEmail(emailData) {
        try {
            const {
                to,
                subject,
                htmlTemplate,
                textTemplate,
                from,
                cc = null,
                bcc = null,
                attachments = null,
                emailCredentials = EmailApiService.emailConfig.defaultCredentials
            } = emailData;

            // Validate required fields
            if (!to || !subject) {
                throw new Error('Missing required fields: to and subject are mandatory');
            }

            if (!htmlTemplate && !textTemplate) {
                throw new Error('At least one template (htmlTemplate or textTemplate) is required');
            }

            // Prepare request payload
            const payload = {
                to,
                subject,
                htmlTemplate,
                textTemplate,
                from,
                emailCredentials
            };

            // Add optional fields only if they exist
            if (cc) payload.cc = cc;
            if (bcc) payload.bcc = bcc;
            if (attachments) payload.attachments = attachments;

            console.log('Sending email request to:', EmailApiService.emailConfig.apiUrl);
            console.log('Email payload:', {
                ...payload,
                emailCredentials: { ...payload.emailCredentials, password: '[HIDDEN]' }
            });

            // Make API call to Azure Function
            const response = await axios.post(EmailApiService.emailConfig.apiUrl, payload, {
                timeout: EmailApiService.emailConfig.timeout,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log('Email API Response:', response.data);
            return response.data;

        } catch (error) {
            console.error('Email API Error:', error.message);

            if (error.response) {
                // API returned an error response
                console.error('API Error Response:', error.response.data);
                throw new Error(`Email service error: ${error.response.data.message || error.response.statusText}`);
            } else if (error.request) {
                // Request was made but no response received
                console.error('No response from email service');
                throw new Error('Email service is not responding. Please try again later.');
            } else {
                // Something else happened
                throw new Error(`Email configuration error: ${error.message}`);
            }
        }
    }

}

module.exports = {
    EmailApiService
};