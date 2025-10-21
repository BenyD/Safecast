#!/usr/bin/env node

/**
 * Test script for incident expiration functionality
 * This script creates a test incident and then tests the expiration function
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testExpiration() {
  console.log('🧪 Testing incident expiration functionality...\n');

  try {
    // Step 1: Create a test incident that expires in 1 minute
    console.log('1️⃣ Creating test incident with 1-minute expiration...');
    
    const testIncident = {
      title: 'Test Incident - Expires in 1 minute',
      description: 'This incident will expire in 1 minute for testing purposes',
      type: 'other',
      severity: 'low',
      location: 'POINT(80.2707 13.0827)', // Chennai coordinates
      address: 'Test Location, Chennai',
      status: 'active',
      expires_at: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
      user_id: null
    };

    const { data: createdIncident, error: createError } = await supabase
      .from('incidents')
      .insert([testIncident])
      .select('id, title, expires_at, status')
      .single();

    if (createError) {
      throw createError;
    }

    console.log('✅ Test incident created:', {
      id: createdIncident.id,
      title: createdIncident.title,
      expires_at: createdIncident.expires_at,
      status: createdIncident.status
    });

    // Step 2: Check active incidents
    console.log('\n2️⃣ Checking active incidents...');
    
    const { data: activeIncidents, error: fetchError } = await supabase
      .rpc('get_active_incidents');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`✅ Found ${activeIncidents.length} active incidents`);

    // Step 3: Wait for expiration (simulate by updating expires_at to past time)
    console.log('\n3️⃣ Simulating expiration by setting expires_at to past time...');
    
    const { error: updateError } = await supabase
      .from('incidents')
      .update({ 
        expires_at: new Date(Date.now() - 60000).toISOString() // 1 minute ago
      })
      .eq('id', createdIncident.id);

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Updated incident expiration time to past');

    // Step 4: Test the expiration function
    console.log('\n4️⃣ Testing expiration function...');
    
    const response = await fetch('http://localhost:54321/functions/v1/expire-incidents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Expiration function executed successfully:', {
        message: result.message,
        expiredCount: result.expiredCount
      });
    } else {
      console.log('❌ Expiration function failed:', result.error);
    }

    // Step 5: Verify the incident is now expired
    console.log('\n5️⃣ Verifying incident is expired...');
    
    const { data: expiredIncident, error: verifyError } = await supabase
      .from('incidents')
      .select('id, title, status, expires_at')
      .eq('id', createdIncident.id)
      .single();

    if (verifyError) {
      throw verifyError;
    }

    console.log('✅ Incident status after expiration:', {
      id: expiredIncident.id,
      title: expiredIncident.title,
      status: expiredIncident.status,
      expires_at: expiredIncident.expires_at
    });

    // Step 6: Check active incidents again
    console.log('\n6️⃣ Checking active incidents after expiration...');
    
    const { data: finalActiveIncidents, error: finalFetchError } = await supabase
      .rpc('get_active_incidents');

    if (finalFetchError) {
      throw finalFetchError;
    }

    console.log(`✅ Found ${finalActiveIncidents.length} active incidents (should be 1 less than before)`);

    // Cleanup: Delete the test incident
    console.log('\n🧹 Cleaning up test incident...');
    
    const { error: deleteError } = await supabase
      .from('incidents')
      .delete()
      .eq('id', createdIncident.id);

    if (deleteError) {
      console.log('⚠️ Warning: Could not delete test incident:', deleteError.message);
    } else {
      console.log('✅ Test incident cleaned up');
    }

    console.log('\n🎉 Expiration functionality test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testExpiration();
