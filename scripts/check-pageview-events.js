#!/usr/bin/env node

/**
 * Quick script to check page_view events in database
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function checkEvents() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL not found in environment');
        process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        // Check total page_view events
        const totalEvents = await sql`
            SELECT COUNT(*) as count 
            FROM visitor_events 
            WHERE event_type = 'page_view'
        `;
        console.log(`Total page_view events: ${totalEvents[0].count}`);

        // Check recent sessions
        const recentSessions = await sql`
            SELECT session_id, start_time, last_heartbeat
            FROM visitor_sessions
            ORDER BY start_time DESC
            LIMIT 5
        `;
        console.log(`\nRecent sessions (${recentSessions.length}):`);
        recentSessions.forEach(s => {
            console.log(`  - ${s.session_id} (${s.start_time})`);
        });

        // Check recent page_view events
        const recentEvents = await sql`
            SELECT ve.event_type, ve.path, ve.timestamp, vs.session_id
            FROM visitor_events ve
            JOIN visitor_sessions vs ON vs.id = ve.session_uuid
            WHERE ve.event_type = 'page_view'
            ORDER BY ve.timestamp DESC
            LIMIT 10
        `;
        console.log(`\nRecent page_view events (${recentEvents.length}):`);
        recentEvents.forEach(e => {
            console.log(`  - ${e.path} (session: ${e.session_id}, time: ${e.timestamp})`);
        });

    } catch (error) {
        console.error('❌ Database error:', error.message);
        process.exit(1);
    }
}

checkEvents();
