require('dotenv').config();
const connectDB = require('../utils/connectDB');
const User = require('../modules/users/models/User');
const passwordService = require('../utils/passwordService');
const { ROLES } = require('../shared/constants/roles.constant');
const { USER_STATUS } = require('../shared/constants/user-status.constant');

const createSeedUsers = async () => {
    await connectDB();

    const usersToCreate = [
        {
            name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
            email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com',
            password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!',
            phone: process.env.SUPER_ADMIN_PHONE || '0500000000',
            role: ROLES.SUPER_ADMIN,
            status: USER_STATUS.ACTIVE
        },
        {
            name: process.env.CONTENT_MANAGER_NAME || 'Content Manager',
            email: process.env.CONTENT_MANAGER_EMAIL || 'contentmanager@example.com',
            password: process.env.CONTENT_MANAGER_PASSWORD || 'ContentManager123!',
            phone: process.env.CONTENT_MANAGER_PHONE || '0511111111',
            role: ROLES.CONTENT_MANAGER,
            status: USER_STATUS.ACTIVE
        }
    ];

    for (const userData of usersToCreate) {
        const existingUser = await User.findOne({ email: userData.email });

        if (existingUser) {
            console.log(`${userData.email} already exists`);
            continue;
        }

        const hashedPassword = await passwordService.hash(userData.password);
        await User.create({
            ...userData,
            password: hashedPassword
        });

        console.log(`Created user: ${userData.email} (role: ${userData.role}, status: ${userData.status})`);
    }
};

createSeedUsers()
    .then(() => {
        console.log('Seed users completed');
    })
    .catch((error) => {
        console.log('error', error.message);
    })
    .finally(() => {
        process.exit();
    });
