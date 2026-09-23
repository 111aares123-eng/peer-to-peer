const { v4: uuidv4 } = require('uuid');
const { AUTO_SUSPEND_THRESHOLD } = require('../config');

/**
 * Submits a report and executes 3-strike auto-suspension if threshold reached
 */
function reportUser(db, { reporterId, reportedUserId, bookingId = null, category, description }) {
  const reportTx = db.transaction(() => {
    const reportId = uuidv4();

    // 1. Insert report
    db.prepare(`
      INSERT INTO reports_flags (id, reporter_id, reported_user_id, booking_id, category, description, status)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(reportId, reporterId, reportedUserId, bookingId, category, description);

    // 2. Count distinct reporters for this user
    const reportStats = db.prepare(`
      SELECT COUNT(DISTINCT reporter_id) as distinct_reporters, COUNT(*) as total_reports
      FROM reports_flags
      WHERE reported_user_id = ? AND status != 'DISMISSED'
    `).get(reportedUserId);

    const distinctCount = reportStats.distinct_reporters || 0;
    let autoSuspended = false;

    // 3. Auto-suspend if 3 or more distinct reports
    if (distinctCount >= AUTO_SUSPEND_THRESHOLD) {
      db.prepare(`
        UPDATE users 
        SET status = 'SUSPENDED' 
        WHERE id = ?
      `).run(reportedUserId);

      // Also deactivate any open availability slots if tutor
      db.prepare(`
        UPDATE availability_slots 
        SET is_booked = 1 
        WHERE tutor_id = (SELECT id FROM tutor_profiles WHERE user_id = ?)
      `).run(reportedUserId);

      autoSuspended = true;
    }

    return {
      reportId,
      distinctCount,
      autoSuspended,
      threshold: AUTO_SUSPEND_THRESHOLD
    };
  });

  return reportTx();
}

/**
 * Returns reports queue for admin review
 */
function getModerationQueue(db) {
  const reports = db.prepare(`
    SELECT r.*, 
           u_rep.name as reporter_name, u_rep.email as reporter_email,
           u_target.name as reported_name, u_target.email as reported_email, u_target.status as reported_status, u_target.role as reported_role
    FROM reports_flags r
    JOIN users u_rep ON r.reporter_id = u_rep.id
    JOIN users u_target ON r.reported_user_id = u_target.id
    ORDER BY r.created_at DESC
  `).all();

  const suspendedUsers = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.college_domain, u.status,
           COUNT(r.id) as report_count
    FROM users u
    LEFT JOIN reports_flags r ON u.id = r.reported_user_id
    WHERE u.status = 'SUSPENDED'
    GROUP BY u.id
  `).all();

  return { reports, suspendedUsers };
}

/**
 * Admin action to resolve report or lift/affirm suspension
 */
function resolveReport(db, { reportId, action, adminNotes = '' }) {
  const resolveTx = db.transaction(() => {
    const report = db.prepare(`SELECT * FROM reports_flags WHERE id = ?`).get(reportId);
    if (!report) throw new Error('Report not found');

    if (action === 'DISMISS') {
      db.prepare(`UPDATE reports_flags SET status = 'DISMISSED' WHERE id = ?`).run(reportId);
    } else if (action === 'RESOLVE_CONFIRM_BAN') {
      db.prepare(`UPDATE reports_flags SET status = 'RESOLVED' WHERE id = ?`).run(reportId);
      db.prepare(`UPDATE users SET status = 'SUSPENDED' WHERE id = ?`).run(report.reported_user_id);
    } else if (action === 'RESTORE_ACCOUNT') {
      db.prepare(`UPDATE reports_flags SET status = 'RESOLVED' WHERE id = ?`).run(reportId);
      db.prepare(`UPDATE users SET status = 'ACTIVE' WHERE id = ?`).run(report.reported_user_id);
    }

    return { success: true, reportId, action };
  });

  return resolveTx();
}

module.exports = {
  reportUser,
  getModerationQueue,
  resolveReport
};
