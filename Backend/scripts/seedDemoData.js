const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const User = require('../models/User');
const Service = require('../models/Service');
const Availability = require('../models/Availability');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

const args = process.argv.slice(2);
const isResetMode = args.includes('--reset');

if (!isResetMode) {
  console.log('\\n⚠️  SAFE MODE: Database seeding requires explicit reset authorization.');
  console.log('To safely wipe existing DEMO data and seed fresh data, run:');
  console.log('node scripts/seedDemoData.js --reset\\n');
  console.log('NOTE: The admin account will NEVER be deleted by this script.\\n');
  process.exit(0);
}

const seedDatabase = async () => {
  try {
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    console.log('🗑️  Clearing existing non-admin data...');
    // NEVER delete the admin account
    await User.deleteMany({ role: { $ne: 'admin' } });
    await Service.deleteMany({});
    await Availability.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});
    console.log('✅ Old demo data cleared.');

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('DemoPass123!', salt);

    console.log('🌱 Seeding Customers...');
    const customersData = [
      { name: 'Rahul Sharma', email: 'rahul@example.com', password: defaultPassword, role: 'customer' },
      { name: 'Priya Nair', email: 'priya@example.com', password: defaultPassword, role: 'customer' },
      { name: 'Arjun Kumar', email: 'arjun@example.com', password: defaultPassword, role: 'customer' }
    ];
    const customers = await User.insertMany(customersData);

    console.log('🌱 Seeding Providers...');
    const providersData = [
      { name: 'CleanPro Services', email: 'cleanpro@example.com', password: defaultPassword, role: 'provider' },
      { name: 'Urban Repair Hub', email: 'urban@example.com', password: defaultPassword, role: 'provider' },
      { name: 'TechFix Solutions', email: 'techfix@example.com', password: defaultPassword, role: 'provider' },
      { name: 'HomeCare Experts', email: 'homecare@example.com', password: defaultPassword, role: 'provider' }
    ];
    const providers = await User.insertMany(providersData);

    console.log('🌱 Seeding Services...');
    const servicesData = [
      {
        providerId: providers[0]._id, // CleanPro
        title: 'Deep Home Cleaning',
        description: 'Comprehensive deep cleaning for your entire home including hard-to-reach areas.',
        price: 2500,
        category: 'Cleaning',
        duration: 240,
        images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80']
      },
      {
        providerId: providers[0]._id, // CleanPro
        title: 'Premium Sofa Dry Cleaning',
        description: 'Professional dry cleaning for fabric and leather sofas. Removes tough stains and odors.',
        price: 800,
        category: 'Cleaning',
        duration: 60,
        images: ['https://images.unsplash.com/photo-1527772482340-7895c3f20f0f?w=800&q=80']
      },
      {
        providerId: providers[1]._id, // Urban Repair
        title: 'AC Servicing & Gas Top-up',
        description: 'Complete AC checkup, filter cleaning, and refrigerant gas top-up if necessary.',
        price: 1500,
        category: 'Other',
        duration: 90,
        images: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80']
      },
      {
        providerId: providers[1]._id, // Urban Repair
        title: 'Emergency Plumbing Fixes',
        description: 'Fast response plumbing repair for leaks, blockages, and pipe replacements.',
        price: 500,
        category: 'Plumbing',
        duration: 45,
        images: ['https://images.unsplash.com/photo-1505798577917-a65157d3320a?w=800&q=80']
      },
      {
        providerId: providers[3]._id, // HomeCare
        title: 'House Wiring & Electricals',
        description: 'Certified electrical repairs, MCB replacement, and house wiring services.',
        price: 600,
        category: 'Electrical',
        duration: 60,
        images: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80']
      },
      {
        providerId: providers[2]._id, // TechFix
        title: 'Laptop Motherboard Repair',
        description: 'Advanced chip-level repair for laptop motherboards, screen replacement, and upgrades.',
        price: 3500,
        category: 'Other',
        duration: 180,
        images: ['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80']
      },
      {
        providerId: providers[3]._id, // HomeCare
        title: 'Interior Home Painting',
        description: 'High-quality wall painting services using premium washable paints. Includes minor crack filling.',
        price: 15000,
        category: 'Other',
        duration: 900,
        images: ['https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80']
      },
      {
        providerId: providers[0]._id, // CleanPro
        title: 'Advanced Pest Control',
        description: 'Odorless pest control treatment for cockroaches, ants, and termites.',
        price: 1200,
        category: 'Cleaning',
        duration: 60,
        images: ['https://images.unsplash.com/photo-1558904541-efa843a96f09?w=800&q=80']
      },
      {
        providerId: providers[2]._id, // TechFix
        title: 'Custom Website Development',
        description: 'Professional responsive business website development using modern technologies.',
        price: 25000,
        category: 'Other',
        duration: 2880,
        images: ['https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=800&q=80']
      }
    ];
    const services = await Service.insertMany(servicesData);

    console.log('🌱 Seeding Availability...');
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const availabilityData = [];
    providers.forEach(provider => {
      days.forEach(day => {
        const isWeekend = day === 'sunday';
        availabilityData.push({
          providerId: provider._id,
          dayOfWeek: day,
          startTime: isWeekend ? '00:00' : '09:00',
          endTime: isWeekend ? '00:00' : '18:00',
          isAvailable: !isWeekend
        });
      });
    });
    await Availability.insertMany(availabilityData);

    console.log('🌱 Seeding Bookings...');
    
    // Future dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Past dates for completed bookings
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const formatTime = (date) => date.toISOString().split('T')[0];

    const bookingsData = [
      { // 1. Completed
        customerId: customers[0]._id, // Rahul
        providerId: services[0].providerId, 
        serviceId: services[0]._id, // Deep Cleaning
        bookingDate: formatTime(lastWeek),
        startTime: '10:00',
        endTime: '14:00',
        status: 'completed',
        paymentStatus: 'paid'
      },
      { // 2. Completed
        customerId: customers[1]._id, // Priya
        providerId: services[1].providerId, 
        serviceId: services[1]._id, // Sofa
        bookingDate: formatTime(twoDaysAgo),
        startTime: '11:00',
        endTime: '12:00',
        status: 'completed',
        paymentStatus: 'paid'
      },
      { // 3. Pending (Future)
        customerId: customers[2]._id, // Arjun
        providerId: services[2].providerId, 
        serviceId: services[2]._id, // AC Repair
        bookingDate: formatTime(tomorrow),
        startTime: '09:00',
        endTime: '10:30',
        status: 'pending',
        paymentStatus: 'pending'
      },
      { // 4. Accepted (Future)
        customerId: customers[0]._id, // Rahul
        providerId: services[3].providerId, 
        serviceId: services[3]._id, // Plumbing
        bookingDate: formatTime(tomorrow),
        startTime: '14:00',
        endTime: '14:45',
        status: 'accepted',
        paymentStatus: 'pending'
      },
      { // 5. Completed
        customerId: customers[1]._id, // Priya
        providerId: services[4].providerId, 
        serviceId: services[4]._id, // Electrical
        bookingDate: formatTime(lastWeek),
        startTime: '16:00',
        endTime: '17:00',
        status: 'completed',
        paymentStatus: 'paid'
      },
      { // 6. Cancelled
        customerId: customers[2]._id, // Arjun
        providerId: services[5].providerId, 
        serviceId: services[5]._id, // Laptop
        bookingDate: formatTime(lastWeek),
        startTime: '10:00',
        endTime: '13:00',
        status: 'cancelled',
        paymentStatus: 'pending'
      }
    ];
    const bookings = await Booking.insertMany(bookingsData);

    console.log('🌱 Seeding Reviews...');
    const reviewsData = [
      {
        bookingId: bookings[0]._id,
        customerId: bookings[0].customerId,
        serviceId: bookings[0].serviceId,
        rating: 5,
        comment: 'Absolutely fantastic deep cleaning! The team was professional and my house sparkles.'
      },
      {
        bookingId: bookings[1]._id,
        customerId: bookings[1].customerId,
        serviceId: bookings[1].serviceId,
        rating: 4,
        comment: 'Sofa looks brand new. Took slightly longer than expected but great results overall.'
      },
      {
        bookingId: bookings[4]._id,
        customerId: bookings[4].customerId,
        serviceId: bookings[4].serviceId,
        rating: 5,
        comment: 'Very skilled electrician. Fixed my wiring issue in under an hour.'
      }
    ];
    await Review.insertMany(reviewsData);

    console.log('\\n🎉 Database seeded successfully!');
    console.log('\\n------------------------------------');
    console.log('DATASET CREATED:');
    console.log('- 3 Customers (e.g., rahul@example.com)');
    console.log('- 4 Providers (e.g., cleanpro@example.com)');
    console.log('- 9 Services with unique imagery');
    console.log('- Realistic Provider Availability');
    console.log('- 6 Bookings (Mixed statuses: Completed, Pending, Accepted, Cancelled)');
    console.log('- 3 Reviews on completed bookings');
    console.log('\\nDEMO ACCOUNTS PASSWORD: DemoPass123!');
    console.log('------------------------------------\\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
};

seedDatabase();
