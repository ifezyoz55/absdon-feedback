/**
 * Seed Script — creates the initial admin user and sample team members.
 * Run: node scripts/seed.js
 *
 * Requires DATABASE_URL in environment (or .env in backend folder).
 */
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') })
const bcrypt = require('bcryptjs')
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function seed() {
  const client = await pool.connect()
  try {
    console.log('🌱  Seeding database...\n')

    // ── Fetch team IDs ───────────────────────────────
    const teamsRes = await client.query('SELECT id, slug FROM teams')
    const teams = Object.fromEntries(teamsRes.rows.map((t) => [t.slug, t.id]))

    // ── Accounts to create ───────────────────────────
    const accounts = [
      { username: 'admin',     password: 'Admin@1234',   displayName: 'System Admin',       role: 'admin',  teamSlug: null },
      { username: 'dev_lead',  password: 'DevLead@123',  displayName: 'Dev Team Lead',       role: 'lead',   teamSlug: 'dev-team' },
      { username: 'comms_mod', password: 'Comms@123',    displayName: 'Community Manager',   role: 'member', teamSlug: 'community-team' },
      { username: 'biz_dev',   password: 'BizDev@123',   displayName: 'Partnership Manager', role: 'member', teamSlug: 'partnership-team' },
    ]

    for (const acc of accounts) {
      const hash = await bcrypt.hash(acc.password, 10)
      const teamId = acc.teamSlug ? teams[acc.teamSlug] : null
      await client.query(
        `INSERT INTO team_members (username, password_hash, display_name, role, team_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (username) DO UPDATE
           SET password_hash = EXCLUDED.password_hash,
               display_name  = EXCLUDED.display_name,
               role          = EXCLUDED.role,
               team_id       = EXCLUDED.team_id`,
        [acc.username, hash, acc.displayName, acc.role, teamId]
      )
      console.log(`  ✓  ${acc.role.padEnd(6)} — ${acc.username} / ${acc.password}`)
    }

    console.log('\n✅  Seeding complete!\n')
    console.log('────────────────────────────────────────')
    console.log('  Dashboard: http://localhost:5173/dashboard/login')
    console.log('  Admin login: admin / Admin@1234')
    console.log('────────────────────────────────────────\n')
    console.log('⚠️   Change all passwords before deploying to production!\n')
  } finally {
    client.release()
    await pool.end()
  }
}

seed().catch((err) => {
  console.error('Seed error:', err.message)
  process.exit(1)
})
