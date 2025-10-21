"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { IncidentFormData } from "../schemas/incidentSchema";

// Type for the get_active_incidents function return
type ActiveIncident = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  severity: string | null;
  location: unknown;
  address: string | null;
  images: string[] | null;
  created_at: string | null;
  expires_at: string | null;
  status: string | null;
  is_verified: boolean | null;
  user_id: string | null;
};

export function useIncidents() {
  const [incidents, setIncidents] = useState<ActiveIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching incidents...');
      
      // Try RPC function first
      const { data, error } = await supabase
        .rpc('get_active_incidents');

      console.log('RPC response:', { data, error });

      if (error) {
        console.error('Supabase RPC error:', error);
        console.log('Falling back to direct table query...');
        
        // Fallback to direct table query
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('incidents')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        console.log('Fallback query response:', { data: fallbackData, error: fallbackError });

        if (fallbackError) {
          throw fallbackError;
        }

        setIncidents(fallbackData || []);
        setHasFetched(true);
        return;
      }

      console.log('Setting incidents:', data);
      setIncidents(data || []);
      setHasFetched(true);
    } catch (err) {
      console.error('Error fetching incidents:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        error: err
      });
      
      setError(err instanceof Error ? err.message : 'Failed to fetch incidents');
      setHasFetched(true);
    } finally {
      setLoading(false);
    }
  }, []); // Remove retryCount dependency to prevent infinite loops

  useEffect(() => {
    if (!hasFetched) {
      fetchIncidents();
    }
  }, [hasFetched, fetchIncidents]);

  const createIncident = async (incidentData: IncidentFormData & { user_id: string | null }) => {
    try {
      // Convert location object to PostGIS POINT format
      const { location, address, images, ...restData } = incidentData;
      
      // Prepare data for database insertion without location first
      const insertData = {
        ...restData,
        address: address && address.trim() !== '' ? address.trim() : null,
        images: images && images.length > 0 ? images : null,
      };

      console.log('Location data:', location);
      console.log('Creating incident with data:', insertData);

      // Use raw SQL to insert with proper PostGIS POINT format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('create_incident', {
        p_title: insertData.title,
        p_type: insertData.type,
        p_latitude: location.lat,
        p_longitude: location.lng,
        p_description: insertData.description,
        p_severity: insertData.severity,
        p_address: insertData.address,
        p_images: insertData.images,
        p_user_id: insertData.user_id
      });

      if (error) {
        console.error('Supabase insert error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('Incident created successfully:', data);

      // Refresh incidents list
      await fetchIncidents();
      return data;
    } catch (err) {
      console.error('Error creating incident:', err);
      throw err;
    }
  };

  const retryFetch = useCallback(() => {
    setHasFetched(false);
    setError(null);
  }, []);

  return {
    incidents,
    loading,
    error,
    fetchIncidents,
    createIncident,
    retryFetch,
  };
}
