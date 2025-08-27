import Admin from '../models/Admin';

export const createDefaultAdmin = async () => {
  try {
    // Check if any admin exists
    const adminCount = await Admin.countDocuments();
    
    if (adminCount === 0) {
      console.log('🔧 Creating default admin user...');
      
      const defaultAdmin = new Admin({
        email: 'admin@matchmaker.com',
        password: 'admin123456',
        firstName: 'Admin',
        lastName: 'User',
        role: 'super_admin',
        permissions: {
          userManagement: true,
          contentModeration: true,
          analytics: true,
          subscriptionManagement: true,
          systemSettings: true
        },
        isActive: true
      });
      
      await defaultAdmin.save();
      console.log('✅ Default admin user created successfully!');
      console.log('📧 Email: admin@matchmaker.com');
      console.log('🔑 Password: admin123456');
      console.log('⚠️  Please change the password after first login!');
    } else {
      console.log('✅ Admin users already exist in database');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
  }
};
