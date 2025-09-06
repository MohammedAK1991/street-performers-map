import mongoose from 'mongoose';
import { UserModel } from '../domains/user/entities/User';
import { PerformanceModel } from '../domains/performance/entities/Performance';
import { connectDatabase } from '../shared/infrastructure/database';

// Sample users data
const sampleUsers = [
  {
    email: 'mike.jazz@example.com',
    username: 'mikejazz',
    password: 'password123', // This will be hashed by the pre-save hook
    role: 'performer',
    profile: {
      displayName: 'Mike\'s Jazz Collective',
      bio: 'Professional jazz ensemble performing classic and contemporary pieces throughout Madrid.',
      genres: ['jazz', 'blues'],
      socialLinks: {
        instagram: '@mikesjazzmadrid',
        spotify: 'mike-jazz-collective'
      }
    },
    location: {
      city: 'Madrid',
      country: 'Spain',
      coordinates: [-3.7038, 40.4168]
    },
    preferences: {
      notifications: true,
      genres: ['jazz', 'blues', 'classical'],
      radius: 15
    },
    statistics: {
      totalLikes: 1250,
      totalTips: 450,
      performanceCount: 28
    }
  },
  {
    email: 'sarah.folk@example.com',
    username: 'sarahfolk',
    password: 'password123',
    role: 'performer',
    profile: {
      displayName: 'Sarah Folk Singer',
      bio: 'Traditional folk songs and storytelling from around the world. Every song tells a story.',
      genres: ['folk', 'country'],
      socialLinks: {
        instagram: '@sarahfolkstories',
        youtube: 'SarahFolkSinger'
      }
    },
    location: {
      city: 'Madrid',
      country: 'Spain',
      coordinates: [-3.7038, 40.4168]
    },
    preferences: {
      notifications: true,
      genres: ['folk', 'country', 'classical'],
      radius: 20
    },
    statistics: {
      totalLikes: 890,
      totalTips: 320,
      performanceCount: 22
    }
  },
  {
    email: 'brooklyn.rocker@example.com',
    username: 'brooklynrocker',
    password: 'password123',
    role: 'performer',
    profile: {
      displayName: 'Madrid Street Musician',
      bio: 'Acoustic rock and indie covers with original compositions. Music is life!',
      genres: ['rock', 'pop'],
      socialLinks: {
        instagram: '@madridstreetmusic',
        spotify: 'madrid-street-musician'
      }
    },
    location: {
      city: 'Madrid',
      country: 'Spain',
      coordinates: [-3.7038, 40.4168]
    },
    preferences: {
      notifications: true,
      genres: ['rock', 'pop', 'folk'],
      radius: 12
    },
    statistics: {
      totalLikes: 1450,
      totalTips: 680,
      performanceCount: 35
    }
  },
  {
    email: 'classical.carlos@example.com',
    username: 'classicalcarlos',
    password: 'password123',
    role: 'performer',
    profile: {
      displayName: 'Carlos Classical Guitar',
      bio: 'Classical guitar performances featuring works by Bach, Villa-Lobos, and contemporary composers.',
      genres: ['classical'],
      socialLinks: {
        instagram: '@carlosclassicalguitar',
        youtube: 'CarlosClassicalMadrid'
      }
    },
    location: {
      city: 'Madrid',
      country: 'Spain',
      coordinates: [-3.7038, 40.4168]
    },
    preferences: {
      notifications: true,
      genres: ['classical', 'jazz'],
      radius: 10
    },
    statistics: {
      totalLikes: 750,
      totalTips: 280,
      performanceCount: 18
    }
  },
  {
    email: 'john.audience@example.com',
    username: 'johnmusic',
    password: 'password123',
    role: 'audience',
    profile: {
      displayName: 'John Music Lover',
      bio: 'Love discovering new music and supporting local artists!',
      genres: ['jazz', 'rock', 'folk']
    },
    location: {
      city: 'Madrid',
      country: 'Spain',
      coordinates: [-3.7038, 40.4168]
    },
    preferences: {
      notifications: true,
      genres: ['jazz', 'rock', 'folk', 'blues'],
      radius: 25
    },
    statistics: {
      totalLikes: 0,
      totalTips: 0,
      performanceCount: 0
    }
  }
];

// Sample performances data (will use actual user IDs after users are created)
const createSamplePerformances = (userIds: string[]) => [
  {
    performerId: userIds[0], // Mike Jazz
    title: 'Jazz in Retiro Park',
    description: 'Beautiful jazz performance featuring classic standards and modern interpretations in the heart of Madrid. Join us for an evening of soulful music by the iconic Crystal Palace.',
    genre: 'jazz',
    route: {
      stops: [
        {
          location: {
            coordinates: [-3.6821, 40.4200],
            address: 'Palacio de Cristal, Parque del Retiro, Madrid, Spain',
            name: 'Crystal Palace'
          },
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          endTime: new Date(Date.now() + 3.5 * 60 * 60 * 1000), // 3.5 hours from now
          status: 'scheduled'
        }
      ]
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoThumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    engagement: {
      likes: 127,
      views: 340,
      tips: 45,
      likedBy: []
    },
    status: 'live',
    scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 26 * 60 * 60 * 1000) // 26 hours from now
  },
  {
    performerId: userIds[2], // Brooklyn Rocker
    title: 'Street Guitar Vibes',
    description: 'Acoustic rock and folk covers with original compositions. Experience the energy of live street music in the bustling heart of Puerta del Sol.',
    genre: 'rock',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoThumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    route: {
      stops: [
        {
          location: {
            coordinates: [-3.7038, 40.4168],
            address: 'Puerta del Sol, Madrid, Spain',
            name: 'Puerta del Sol'
          },
          startTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
          endTime: new Date(Date.now() + 4.5 * 60 * 60 * 1000), // 4.5 hours from now
          status: 'scheduled'
        },
        {
          location: {
            coordinates: [-3.7104, 40.4168],
            address: 'Plaza Mayor, Madrid, Spain',
            name: 'Plaza Mayor'
          },
          startTime: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
          endTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
          status: 'scheduled'
        }
      ]
    },
    engagement: {
      likes: 89,
      views: 230,
      tips: 32,
      likedBy: []
    },
    status: 'scheduled',
    scheduledFor: new Date(Date.now() + 3 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 27 * 60 * 60 * 1000)
  },
  {
    performerId: userIds[1], // Sarah Folk
    title: 'Folk Stories',
    description: 'Traditional folk songs and storytelling from around the world. Each song carries the wisdom and beauty of different cultures and traditions.',
    genre: 'folk',
    route: {
      stops: [
        {
          location: {
            coordinates: [-3.7038, 40.4168],
            address: 'Parque de El Capricho, Madrid, Spain',
            name: 'El Capricho Park'
          },
          startTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
          endTime: new Date(Date.now() + 5.5 * 60 * 60 * 1000), // 5.5 hours from now
          status: 'scheduled'
        }
      ]
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoThumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    engagement: {
      likes: 45,
      views: 120,
      tips: 15,
      likedBy: []
    },
    status: 'scheduled',
    scheduledFor: new Date(Date.now() + 4 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 28 * 60 * 60 * 1000)
  },
  {
    performerId: userIds[3], // Carlos Classical
    title: 'Classical Guitar Serenades',
    description: 'An intimate classical guitar performance featuring works by Bach, Villa-Lobos, and contemporary composers. Perfect for a peaceful evening in Plaza de Oriente.',
    genre: 'classical',
    route: {
      stops: [
        {
          location: {
            coordinates: [-3.7141, 40.4180],
            address: 'Plaza de Oriente, Madrid, Spain',
            name: 'Plaza de Oriente'
          },
          startTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
          endTime: new Date(Date.now() + 7.5 * 60 * 60 * 1000), // 7.5 hours from now
          status: 'scheduled'
        }
      ]
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoThumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    engagement: {
      likes: 62,
      views: 180,
      tips: 28,
      likedBy: []
    },
    status: 'scheduled',
    scheduledFor: new Date(Date.now() + 6 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 30 * 60 * 60 * 1000)
  },
  {
    performerId: userIds[0], // Mike Jazz (second performance)
    title: 'Late Night Jazz Session',
    description: 'Smooth jazz for a late evening vibe. Join us for an intimate session featuring jazz standards and improvisational pieces.',
    genre: 'jazz',
    route: {
      stops: [
        {
          location: {
            coordinates: [-3.7038, 40.4168],
            address: 'Plaza de Cibeles, Madrid, Spain',
            name: 'Plaza de Cibeles'
          },
          startTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
          endTime: new Date(Date.now() + 9.5 * 60 * 60 * 1000), // 9.5 hours from now
          status: 'scheduled'
        }
      ]
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoThumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    engagement: {
      likes: 78,
      views: 156,
      tips: 42,
      likedBy: []
    },
    status: 'scheduled',
    scheduledFor: new Date(Date.now() + 8 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 32 * 60 * 60 * 1000)
  },
  {
    performerId: userIds[1], // Sarah Folk (second performance)
    title: 'Sunset Folk Circle',
    description: 'A community folk singing circle where stories and songs come together. Everyone is welcome to listen or participate in this magical sunset experience.',
    genre: 'folk',
    route: {
      stops: [
        {
          location: {
            coordinates: [-3.7038, 40.4168],
            address: 'Parque del Retiro, Madrid, Spain',
            name: 'Retiro Park'
          },
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          endTime: new Date(Date.now() + 25.5 * 60 * 60 * 1000), // Tomorrow + 1.5 hours
          status: 'scheduled'
        }
      ]
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoThumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    engagement: {
      likes: 34,
      views: 89,
      tips: 18,
      likedBy: []
    },
    status: 'scheduled',
    scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to database');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await UserModel.deleteMany({});
    await PerformanceModel.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create users
    console.log('👥 Creating sample users...');
    const createdUsers = await UserModel.insertMany(sampleUsers);
    const userIds = createdUsers.map(user => user._id.toString());
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create performances
    console.log('🎭 Creating sample performances...');
    const performanceData = createSamplePerformances(userIds);
    const createdPerformances = await PerformanceModel.insertMany(performanceData);
    console.log(`✅ Created ${createdPerformances.length} performances`);

    // Update some performances with likes from the audience user
    console.log('❤️ Adding sample likes...');
    const audienceUserId = userIds[4]; // John Music Lover
    
    // Add likes to some performances
    await PerformanceModel.updateOne(
      { _id: createdPerformances[0]._id },
      { 
        $push: { 'engagement.likedBy': audienceUserId },
        $inc: { 'engagement.likes': 1 }
      }
    );
    
    await PerformanceModel.updateOne(
      { _id: createdPerformances[2]._id },
      { 
        $push: { 'engagement.likedBy': audienceUserId },
        $inc: { 'engagement.likes': 1 }
      }
    );
    
    console.log('✅ Added sample likes');

    console.log('🎉 Database seeding completed successfully!');
    console.log(`
    📊 Seeded Data Summary:
    - Users: ${createdUsers.length} (${createdUsers.filter(u => u.role === 'performer').length} performers, ${createdUsers.filter(u => u.role === 'audience').length} audience)
    - Performances: ${createdPerformances.length}
    - Genres: jazz, rock, folk, classical
    - Locations: Retiro Park, Puerta del Sol, Plaza Mayor, El Capricho Park, Plaza de Oriente, Plaza de Cibeles
    
    🧪 Test Accounts:
    - mike.jazz@example.com / password123 (Performer)
    - sarah.folk@example.com / password123 (Performer)  
    - brooklyn.rocker@example.com / password123 (Performer)
    - classical.carlos@example.com / password123 (Performer)
    - john.audience@example.com / password123 (Audience)
    `);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
}

// Run the seeding function
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };