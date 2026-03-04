import { pool, query } from './connection.js';

const createTables = async () => {
  try {
    console.log('Starting database migration...');

    // Users table (Masters and Clients)
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        username VARCHAR(255),
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255),
        phone VARCHAR(20),
        role VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (role IN ('master', 'client')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created');

    // Master profiles
    await query(`
      CREATE TABLE IF NOT EXISTS master_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        business_name VARCHAR(255),
        description TEXT,
        address TEXT,
        phone VARCHAR(20),
        working_hours JSONB DEFAULT '{
          "monday": {"start": "09:00", "end": "18:00", "isWorking": true},
          "tuesday": {"start": "09:00", "end": "18:00", "isWorking": true},
          "wednesday": {"start": "09:00", "end": "18:00", "isWorking": true},
          "thursday": {"start": "09:00", "end": "18:00", "isWorking": true},
          "friday": {"start": "09:00", "end": "18:00", "isWorking": true},
          "saturday": {"start": "09:00", "end": "18:00", "isWorking": true},
          "sunday": {"start": "09:00", "end": "18:00", "isWorking": false}
        }',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Master profiles table created');

    // Services
    await query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        master_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 60,
        color VARCHAR(7) DEFAULT '#3B82F6',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Services table created');

    // Appointments
    await query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        master_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
        appointment_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
        notes TEXT,
        client_name VARCHAR(255),
        client_phone VARCHAR(20),
        reminder_sent BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Appointments table created');

    // Time slots (for caching available slots)
    await query(`
      CREATE TABLE IF NOT EXISTS time_slots (
        id SERIAL PRIMARY KEY,
        master_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        slot_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_available BOOLEAN DEFAULT true,
        appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Time slots table created');

    // Notifications log
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'sent'
      )
    `);
    console.log('✓ Notifications table created');

    // Create indexes
    await query('CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_appointments_master_id ON appointments(master_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date)');
    await query('CREATE INDEX IF NOT EXISTS idx_services_master_id ON services(master_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_time_slots_master_date ON time_slots(master_id, slot_date)');
    console.log('✓ Indexes created');

    console.log('\n✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

createTables();
