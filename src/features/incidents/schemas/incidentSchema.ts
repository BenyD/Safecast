import { z } from "zod";

export const incidentFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().optional(),
  type: z.enum([
    "water_logging",
    "fallen_trees", 
    "sewage_issues",
    "house_flooding",
    "wildlife_hazard",
    "vehicle_stuck",
    "other"
  ], {
    required_error: "Please select an incident type",
  }),
  severity: z.enum(["low", "medium", "high", "urgent"], {
    required_error: "Please select a severity level",
  }),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  address: z.string().optional(),
  images: z.array(z.string()).optional(),
});

export type IncidentFormData = z.infer<typeof incidentFormSchema>;
