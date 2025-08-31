// TypeScript interfaces for Travectio Fleet Management System
// Compatible with Supabase database schema

import { z } from "zod";

// Base types
export interface BaseEntity {
  id: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// User types
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
  isFounder: number;
  isAdmin: number;
  isActive: number;
  phone?: string | null;
  company?: string | null;
  title?: string | null;
  terminatedAt?: Date | null;
  terminatedBy?: string | null;
  terminationReason?: string | null;
  instanceId?: string | null;
}

export interface UpsertUser extends Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
  id: string;
}

// Truck types
export interface Truck extends BaseEntity {
  userId: string;
  name: string;
  fixedCosts: number;
  variableCosts: number;
  totalMiles: number;
  isActive: number;
  vin?: string | null;
  licensePlate?: string | null;
  eldDeviceId?: string | null;
  currentDriverId?: string | null;
  equipmentType: string;
  loadBoardIntegration?: string | null;
  elogsIntegration?: string | null;
  preferredLoadBoard?: string | null;
  elogsProvider?: string | null;
  costPerMile?: number | null; // Add missing costPerMile property
  driver?: Driver | null; // Add missing driver property
}

export interface InsertTruck extends Omit<Truck, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

// Load types
export interface Load extends BaseEntity {
  userId: string;
  truckId?: string | null;
  type: string;
  pay: number;
  miles: number;
  isProfitable: number;
  estimatedFuelCost: number;
  estimatedGallons: number;
  status: string;
  originCity?: string | null;
  originState?: string | null;
  destinationCity?: string | null;
  destinationState?: string | null;
  deadheadFromCity?: string | null;
  deadheadFromState?: string | null;
  deadheadMiles: number;
  totalMilesWithDeadhead: number;
  pickupDate?: Date | null;
  deliveryDate?: Date | null;
  notes?: string | null;
  commodity?: string | null; // Add missing commodity property
  ratePerMile?: number | null; // Add missing ratePerMile property
}

export interface InsertLoad extends Omit<Load, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

// Load Stop types
export interface LoadStop extends BaseEntity {
  loadId: string;
  sequence: number;
  type: 'pickup' | 'delivery';
  stopType: 'pickup' | 'delivery'; // Add missing stopType property
  city: string;
  state: string;
  scheduledTime?: Date | null;
  actualTime?: Date | null;
  notes?: string | null;
}

export interface InsertLoadStop extends Omit<LoadStop, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

// Driver types
export interface Driver extends BaseEntity {
  userId: string;
  firstName: string; // Add missing name properties
  lastName: string;
  name: string; // Keep for backward compatibility
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: Date;
  cdlNumber: string; // Add missing CDL number property
  phoneNumber?: string | null;
  email?: string | null;
  isActive: number;
  currentTruckId?: string | null;
  eldDeviceId?: string | null;
  preferredLoadTypes?: string[] | null;
  notes?: string | null;
}

export interface InsertDriver extends Omit<Driver, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

// HOS Log types
export interface HosLog extends BaseEntity {
  driverId: string;
  truckId?: string | null;
  dutyStatus: string;
  location?: string | null;
  timestamp: Date;
  notes?: string | null;
  violations?: string[] | null; // Add missing violations property
  driveTimeRemaining?: number | null; // Add missing time properties
  onDutyRemaining?: number | null;
  cycleHoursRemaining?: number | null;
}

export interface InsertHosLog extends Omit<HosLog, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

// Load Board types
export interface LoadBoardItem extends BaseEntity {
  userId: string;
  loadBoardSource: string; // Add missing source property
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  equipmentType: string;
  weight: number;
  length: number;
  pay: number;
  miles: number;
  ratePerMile: number; // Add missing ratePerMile property
  pickupDate: Date;
  deliveryDate: Date;
  status: string;
  loadBoardProvider: string;
  externalId?: string | null;
  notes?: string | null;
}

export interface InsertLoadBoard extends Omit<LoadBoardItem, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

// Fleet Metrics types
export interface FleetMetrics extends BaseEntity {
  userId: string;
  date: Date;
  totalRevenue: number;
  totalMiles: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalDriverPay: number;
  profitMargin: number;
  revenuePerMile: number;
  costPerMile: number;
  fuelEfficiency: number;
  notes?: string | null;
}

export interface InsertFleetMetrics extends Omit<FleetMetrics, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

// Truck Cost Breakdown types
export interface TruckCostBreakdown extends BaseEntity {
  truckId: string;
  weekStarting: Date;
  weekEnding: Date;
  truckPayment: number;
  trailerPayment: number;
  elogSubscription: number;
  liabilityInsurance: number;
  physicalInsurance: number;
  cargoInsurance: number;
  trailerInterchange: number;
  bobtailInsurance: number;
  nonTruckingLiability: number;
  basePlateDeduction: number;
  companyPhone: number;
  driverPay: number;
  fuel: number;
  defFluid: number;
  maintenance: number;
  iftaTaxes: number;
  tolls: number;
  dwellTime: number;
  reeferFuel: number;
  truckParking: number;
  gallonsUsed: number;
  avgFuelPrice: number;
  milesPerGallon: number;
  totalFixedCosts: number;
  totalVariableCosts: number;
  totalWeeklyCosts: number;
  costPerMile: number;
  milesThisWeek: number;
  totalMilesWithDeadhead: number;
}

export interface InsertTruckCostBreakdown extends Omit<TruckCostBreakdown, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

// Load Plan types
export interface LoadPlan extends BaseEntity {
  userId: string;
  name: string;
  description?: string | null;
  startDate: Date;
  endDate: Date;
  status: string;
  totalRevenue: number;
  totalMiles: number;
  estimatedProfit: number;
  notes?: string | null;
}

export interface InsertLoadPlan extends Omit<LoadPlan, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

// Load Plan Leg types
export interface LoadPlanLeg extends BaseEntity {
  planId: string;
  sequence: number;
  loadId?: string | null;
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  estimatedRevenue: number;
  estimatedMiles: number;
  scheduledDate: Date;
  status: string;
  notes?: string | null;
}

export interface InsertLoadPlanLeg extends Omit<LoadPlanLeg, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

// Fuel Purchase types
export interface FuelPurchase extends BaseEntity {
  truckId: string;
  loadId?: string | null;
  fuelType: string;
  gallons: number;
  pricePerGallon: number;
  totalCost: number;
  stationName?: string | null;
  stationAddress?: string | null;
  purchaseDate: Date;
  receiptNumber?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
}

export interface InsertFuelPurchase extends Omit<FuelPurchase, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

// Activity types
export interface Activity extends BaseEntity {
  userId: string;
  title: string; // Add missing title property
  type: string;
  description: string;
  metadata?: Record<string, any> | null;
  timestamp: Date;
  relatedTruckId?: string | null; // Add missing related fields
  relatedDriverId?: string | null;
  relatedLoadId?: string | null;
}

export interface InsertActivity extends Omit<Activity, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

// User Analytics types
export interface UserAnalytics extends BaseEntity {
  userId: string;
  sessionId: string; // Add missing sessionId property
  sessionStartTime: Date; // Add missing session properties
  date: Date;
  pageViews: number;
  timeSpent: number;
  actionsPerformed: number;
  featuresUsed: string[];
  sessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  totalPageViews: number; // Add missing total properties
  trucksManaged: number;
  loadsCreated: number;
  driversManaged: number;
  fuelPurchasesRecorded: number;
  totalRevenue: number;
  totalMiles: number;
  avgProfitPerLoad: number;
  fleetUtilization: number;
  isPrivate: number; // Add missing privacy properties
  allowAnalytics: number;
}

export interface InsertUserAnalytics extends Omit<UserAnalytics, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

// Data Input Tracking types
export interface DataInputTracking extends BaseEntity {
  userId: string;
  dataType: string;
  inputMethod: string;
  timestamp: Date;
  metadata?: Record<string, any> | null;
}

export interface InsertDataInputTracking extends Omit<DataInputTracking, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

// System Metrics types
export interface SystemMetrics extends BaseEntity {
  metricName: string;
  metricValue: number;
  timestamp: Date;
  metadata?: Record<string, any> | null;
}

export interface InsertSystemMetrics extends Omit<SystemMetrics, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

// Feature Analytics types
export interface FeatureAnalytics extends BaseEntity {
  featureName: string;
  usageCount: number;
  activeUsers: number;
  timestamp: Date;
  metadata?: Record<string, any> | null;
}

export interface InsertFeatureAnalytics extends Omit<FeatureAnalytics, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

// User Session types
export interface UserSession extends BaseEntity {
  userId: string;
  sessionToken: string;
  isActive: number;
  expiresAt: Date;
  userAgent: string;
  ipAddress: string;
  lastActivity: Date;
}

export interface InsertUserSession extends Omit<UserSession, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

// Session Audit Log types
export interface SessionAuditLog extends BaseEntity {
  userId: string;
  sessionId: string;
  action: string;
  timestamp: Date;
  metadata?: Record<string, any> | null;
}

export interface InsertSessionAuditLog extends Omit<SessionAuditLog, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

// Zod schemas for validation (if needed)
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  profileImageUrl: z.string().nullable().optional(),
  isFounder: z.number(),
  isAdmin: z.number(),
  isActive: z.number(),
  phoneNumber: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  subscriptionTier: z.string().nullable().optional(),
  lastLoginAt: z.date().nullable().optional(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});

export const TruckSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  fixedCosts: z.number(),
  variableCosts: z.number(),
  totalMiles: z.number(),
  isActive: z.number(),
  vin: z.string().nullable().optional(),
  licensePlate: z.string().nullable().optional(),
  eldDeviceId: z.string().nullable().optional(),
  currentDriverId: z.string().nullable().optional(),
  equipmentType: z.string(),
  loadBoardIntegration: z.string().nullable().optional(),
  elogsIntegration: z.string().nullable().optional(),
  preferredLoadBoard: z.string().nullable().optional(),
  elogsProvider: z.string().nullable().optional(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});

export const LoadSchema = z.object({
  id: z.string(),
  userId: z.string(),
  truckId: z.string().nullable().optional(),
  type: z.string(),
  pay: z.number(),
  miles: z.number(),
  isProfitable: z.number(),
  estimatedFuelCost: z.number(),
  estimatedGallons: z.number(),
  status: z.string(),
  originCity: z.string().nullable().optional(),
  originState: z.string().nullable().optional(),
  destinationCity: z.string().nullable().optional(),
  destinationState: z.string().nullable().optional(),
  deadheadFromCity: z.string().nullable().optional(),
  deadheadFromState: z.string().nullable().optional(),
  deadheadMiles: z.number(),
  totalMilesWithDeadhead: z.number(),
  pickupDate: z.date().nullable().optional(),
  deliveryDate: z.date().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});

// Insert schemas for validation
export const insertTruckSchema = z.object({
  userId: z.string(),
  name: z.string(),
  fixedCosts: z.number(),
  variableCosts: z.number(),
  totalMiles: z.number().default(0),
  isActive: z.number().default(1),
  vin: z.string().nullable().optional(),
  licensePlate: z.string().nullable().optional(),
  eldDeviceId: z.string().nullable().optional(),
  currentDriverId: z.string().nullable().optional(),
  equipmentType: z.string().default("Dry Van"),
  loadBoardIntegration: z.string().default("manual").optional(),
  elogsIntegration: z.string().default("manual").optional(),
  preferredLoadBoard: z.string().nullable().optional(),
  elogsProvider: z.string().nullable().optional(),
});

export const insertLoadSchema = z.object({
  userId: z.string(),
  truckId: z.string().nullable().optional(),
  type: z.string(),
  pay: z.number(),
  miles: z.number(),
  isProfitable: z.number(),
  estimatedFuelCost: z.number().default(0),
  estimatedGallons: z.number().default(0),
  status: z.string().default("pending"),
  originCity: z.string().nullable().optional(),
  originState: z.string().nullable().optional(),
  destinationCity: z.string().nullable().optional(),
  destinationState: z.string().nullable().optional(),
  deadheadFromCity: z.string().nullable().optional(),
  deadheadFromState: z.string().nullable().optional(),
  deadheadMiles: z.number().default(0),
  totalMilesWithDeadhead: z.number(),
  pickupDate: z.date().nullable().optional(),
  deliveryDate: z.date().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const insertActivitySchema = z.object({
  userId: z.string(),
  type: z.string(),
  description: z.string(),
  metadata: z.record(z.any()).nullable().optional(),
  timestamp: z.date(),
});

export const insertDriverSchema = z.object({
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  name: z.string(),
  cdlNumber: z.string(),
  licenseNumber: z.string(),
  licenseState: z.string(),
  licenseExpiry: z.date(),
  phoneNumber: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  isActive: z.number().default(1),
  currentTruckId: z.string().nullable().optional(),
  eldDeviceId: z.string().nullable().optional(),
  preferredLoadTypes: z.array(z.string()).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const insertHosLogSchema = z.object({
  driverId: z.string(),
  truckId: z.string().nullable().optional(),
  dutyStatus: z.string(),
  location: z.string().nullable().optional(),
  timestamp: z.date(),
  notes: z.string().nullable().optional(),
  violations: z.array(z.string()).nullable().optional(),
});

export const insertLoadBoardSchema = z.object({
  userId: z.string(),
  loadBoardSource: z.string(),
  originCity: z.string(),
  originState: z.string(),
  destinationCity: z.string(),
  destinationState: z.string(),
  equipmentType: z.string(),
  weight: z.number(),
  length: z.number(),
  pay: z.number(),
  miles: z.number(),
  ratePerMile: z.number(),
  pickupDate: z.date(),
  deliveryDate: z.date(),
  status: z.string(),
  loadBoardProvider: z.string(),
  externalId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const insertTruckCostBreakdownSchema = z.object({
  truckId: z.string(),
  weekStarting: z.date(),
  weekEnding: z.date(),
  truckPayment: z.number().default(0),
  trailerPayment: z.number().default(0),
  elogSubscription: z.number().default(0),
  liabilityInsurance: z.number().default(0),
  physicalInsurance: z.number().default(0),
  cargoInsurance: z.number().default(0),
  trailerInterchange: z.number().default(0),
  bobtailInsurance: z.number().default(0),
  nonTruckingLiability: z.number().default(0),
  basePlateDeduction: z.number().default(0),
  companyPhone: z.number().default(0),
  driverPay: z.number().default(0),
  fuel: z.number().default(0),
  defFluid: z.number().default(0),
  maintenance: z.number().default(0),
  iftaTaxes: z.number().default(0),
  tolls: z.number().default(0),
  dwellTime: z.number().default(0),
  reeferFuel: z.number().default(0),
  truckParking: z.number().default(0),
  gallonsUsed: z.number().default(0),
  avgFuelPrice: z.number().default(0),
  milesPerGallon: z.number().default(0),
  totalFixedCosts: z.number().default(0),
  totalVariableCosts: z.number().default(0),
  totalWeeklyCosts: z.number().default(0),
  costPerMile: z.number().default(0),
  milesThisWeek: z.number().default(0),
  totalMilesWithDeadhead: z.number().default(0),
});

export const insertLoadPlanSchema = z.object({
  userId: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.string(),
  totalRevenue: z.number(),
  totalMiles: z.number(),
  estimatedProfit: z.number(),
  notes: z.string().nullable().optional(),
});

export const insertLoadPlanLegSchema = z.object({
  planId: z.string(),
  sequence: z.number(),
  loadId: z.string().nullable().optional(),
  originCity: z.string(),
  originState: z.string(),
  destinationCity: z.string(),
  destinationState: z.string(),
  estimatedRevenue: z.number(),
  estimatedMiles: z.number(),
  scheduledDate: z.date(),
  status: z.string(),
  notes: z.string().nullable().optional(),
});
