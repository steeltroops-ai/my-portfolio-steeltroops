#!/usr/bin/env bun
/**
 * Task 4.1: Test Autofill Detection
 * 
 * This script tests the autofill detection functionality in the Contact form.
 * It verifies that:
 * 1. Autofill events are captured from the Contact form
 * 2. Identity resolution is triggered with source='autofill' or 'autofill_nav'
 * 3. The identify action is sent to the backend
 * 4. Database is updated with known_entities and visitor_profiles linkage
 * 
 * Requirements tested: Requirement 4 (Identity Resolution)
 */

import { chromium } from 'playwright';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Test configuration
const BASE_UR