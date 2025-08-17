import { z } from "zod";
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const assetFormSchema = z.object({
  lesseeName: z.string().min(1, "Lessee name is required"),
  lesseeEmail: z.string().email("Please enter a valid email address"),
  source: z.string().min(1, "Source is required"),
  itemName: z.string().min(1, "Item name is required"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  currentMeter: z.number().min(0, "Current meter must be positive"),
  proposedMeter: z.number().min(0, "Proposed meter must be positive"),
  meterUnit: z.string().min(1, "Meter unit is required"),
  itemDescription: z.string().optional(),
  subjectPrice: z.number().min(0, "Subject price must be positive"),
  industry: z.string().min(1, "Industry is required"),
  assetType: z.string().min(1, "Asset type is required"),
  status: z.string().min(1, "Status is required"),
  application: z.string().min(1, "Application is required"),
  structure: z.string().min(1, "Structure is required"),
  termMonths: z.number().min(1, "Term must be at least 1 month").max(240, "Term cannot exceed 240 months"),
});

export type AssetFormData = z.infer<typeof assetFormSchema>;

// Database table definitions (for compatibility with storage interface)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
});

export const insertUserSchema = createInsertSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
