require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/Users');

const seedUsers = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to MongoDB');

        // Check if users already exist
        const existingUsers = await User.countDocuments();

        if (existingUsers > 0) {
            console.log(`ℹ️  ${existingUsers} users already exist in the database`);
            const choice = await askQuestion('Do you want to clear existing users and create new ones? (yes/no): ');

            if (choice.toLowerCase() !== 'yes') {
                console.log('❌ Seeding cancelled');
                process.exit(0);
            }

            await User.deleteMany({});
            console.log('🗑️  Existing users deleted');
        }

        // Create 5 default users
        const users = [
            {
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'admin123',
                role: 'admin'
            },
            {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'john123',
                role: 'user'
            },
            {
                name: 'Jane Smith',
                email: 'jane@example.com',
                password: 'jane123',
                role: 'user'
            },
            {
                name: 'Mike Johnson',
                email: 'mike@example.com',
                password: 'mike123',
                role: 'user'
            },
            {
                name: 'Sarah Williams',
                email: 'sarah@example.com',
                password: 'sarah123',
                role: 'user'
            }
        ];

        // Insert users
        const createdUsers = await User.create(users);

        console.log('\n✅ Users created successfully!\n');
        console.log('📋 Login Credentials:\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        createdUsers.forEach((user, index) => {
            console.log(`\n${index + 1}. ${user.name} (${user.role})`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: ${users[index].password}`);
        });

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('⚠️  Please change these passwords after first login!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding users:', error);
        process.exit(1);
    }
};

// Helper function to ask questions in terminal
const askQuestion = (question) => {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        readline.question(question, (answer) => {
            readline.close();
            resolve(answer);
        });
    });
};

// Run seed
console.log('🌱 Starting user seeding...\n');
seedUsers();