import { query, transaction } from '../database/connection.js';

export class UserService {
  static async findByTelegramId(telegramId) {
    const result = await query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async createOrUpdate(userData) {
    const { telegram_id, username, first_name, last_name, role = 'client' } = userData;
    
    const existing = await this.findByTelegramId(telegram_id);
    
    if (existing) {
      const result = await query(
        `UPDATE users 
         SET username = $1, first_name = $2, last_name = $3, updated_at = CURRENT_TIMESTAMP
         WHERE telegram_id = $4
         RETURNING *`,
        [username, first_name, last_name, telegram_id]
      );
      return result.rows[0];
    }
    
    const result = await query(
      `INSERT INTO users (telegram_id, username, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [telegram_id, username, first_name, last_name, role]
    );
    
    // If user is a master, create master profile
    if (role === 'master') {
      await query(
        'INSERT INTO master_profiles (user_id) VALUES ($1)',
        [result.rows[0].id]
      );
    }
    
    return result.rows[0];
  }

  static async updatePhone(userId, phone) {
    const result = await query(
      'UPDATE users SET phone = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [phone, userId]
    );
    return result.rows[0];
  }

  static async getMasterProfile(userId) {
    const result = await query(
      `SELECT mp.*, u.first_name, u.last_name, u.username, u.phone
       FROM master_profiles mp
       JOIN users u ON mp.user_id = u.id
       WHERE mp.user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  static async updateMasterProfile(userId, profileData) {
    const { business_name, description, address, phone, working_hours } = profileData;
    
    const result = await query(
      `UPDATE master_profiles 
       SET business_name = $1, description = $2, address = $3, phone = $4, working_hours = $5, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $6
       RETURNING *`,
      [business_name, description, address, phone, JSON.stringify(working_hours), userId]
    );
    return result.rows[0];
  }

  static async getAllMasters() {
    const result = await query(
      `SELECT u.id, u.first_name, u.last_name, u.username, mp.business_name, mp.description
       FROM users u
       JOIN master_profiles mp ON u.id = mp.user_id
       WHERE u.role = 'master' AND u.is_active = true`
    );
    return result.rows;
  }
}
