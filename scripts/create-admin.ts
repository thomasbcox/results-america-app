import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { AuthService } from '../src/lib/services/authService';

async function createAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Please provide an email address: npm run create-admin <email>');
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existingUser = await AuthService.getUserByEmail(email);
    
    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log(`✅ User ${email} is already an admin`);
        return;
      } else {
        // Promote existing user to admin
        await AuthService.promoteToAdmin(existingUser.id);
        console.log(`✅ Promoted ${email} to admin`);
        return;
      }
    }

    // Create new admin user
    const [user] = await db.insert(users).values({
      email,
      role: 'admin',
      isActive: 1,
      emailVerified: 1,
    }).returning();

    console.log(`✅ Created admin user: ${email} (ID: ${user.id})`);
    console.log('You can now sign in using the magic link authentication system.');
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    process.exit(1);
  }
}

createAdmin().catch(console.error); 