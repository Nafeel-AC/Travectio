import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const trucks = pgTable("trucks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().default('45506370'),
  name: text("name").notNull(),
  fixedCosts: real("fixed_costs").notNull(),
  variableCosts: real("variable_costs").notNull(),
  totalMiles: integer("total_miles").notNull().default(0),
  isActive: integer("is_active").notNull().default(1), // SQLite boolean as integer
  vin: text("vin"),
  licensePlate: text("license_plate"),
  eldDeviceId: text("eld_device_id"),
  currentDriverId: varchar("current_driver_id"),
  equipmentType: text("equipment_type").notNull().default("Dry Van"), // "Dry Van", "Reefer", "Flatbed"
  // Integration options
  loadBoardIntegration: text("load_board_integration").default("manual"),
  elogsIntegration: text("elogs_integration").default("manual"),
  preferredLoadBoard: text("preferred_load_board"),
  elogsProvider: text("elogs_provider"),
});

// Detailed cost breakdown for individual trucks (weekly basis)
export const truckCostBreakdown = pgTable("truck_cost_breakdown", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  truckId: varchar("truck_id").references(() => trucks.id).notNull(),
  
  // Fixed costs (weekly basis)
  truckPayment: real("truck_payment").notNull().default(0),
  trailerPayment: real("trailer_payment").notNull().default(0),
  elogSubscription: real("elog_subscription").notNull().default(0),
  liabilityInsurance: real("liability_insurance").notNull().default(0),
  physicalInsurance: real("physical_insurance").notNull().default(0),
  cargoInsurance: real("cargo_insurance").notNull().default(0),
  trailerInterchange: real("trailer_interchange").notNull().default(0),
  bobtailInsurance: real("bobtail_insurance").notNull().default(0),
  nonTruckingLiability: real("non_trucking_liability").notNull().default(0),
  basePlateDeduction: real("base_plate_deduction").notNull().default(0),
  companyPhone: real("company_phone").notNull().default(0),
  
  // Variable costs (weekly basis)
  driverPay: real("driver_pay").notNull().default(0),
  fuel: real("fuel").notNull().default(0), // main fuel costs from attached fuel purchases
  defFluid: real("def_fluid").notNull().default(0), // DEF (Diesel Exhaust Fluid) costs from attached purchases
  maintenance: real("maintenance").notNull().default(0),
  iftaTaxes: real("ifta_taxes").notNull().default(0),
  tolls: real("tolls").notNull().default(0),
  dwellTime: real("dwell_time").notNull().default(0), // charges for delays over 2 hours
  reeferFuel: real("reefer_fuel").notNull().default(0), // additional fuel for reefer trucks
  truckParking: real("truck_parking").notNull().default(0), // weekly truck parking costs
  
  // Fuel efficiency tracking
  gallonsUsed: real("gallons_used").notNull().default(0), // total gallons consumed this week
  avgFuelPrice: real("avg_fuel_price").notNull().default(0), // average price per gallon
  milesPerGallon: real("miles_per_gallon").notNull().default(0), // calculated MPG
  
  // Calculated fields
  totalFixedCosts: real("total_fixed_costs").notNull().default(0),
  totalVariableCosts: real("total_variable_costs").notNull().default(0),
  totalWeeklyCosts: real("total_weekly_costs").notNull().default(0),
  costPerMile: real("cost_per_mile").notNull().default(0),
  
  // Week tracking
  weekStarting: timestamp("week_starting").notNull(),
  weekEnding: timestamp("week_ending").notNull(),
  milesThisWeek: real("miles_this_week").notNull().default(0), // revenue miles only
  totalMilesWithDeadhead: real("total_miles_with_deadhead").notNull().default(0), // all miles driven (loaded + deadhead)
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const loads = pgTable("loads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().default('45506370'),
  truckId: varchar("truck_id").references(() => trucks.id),
  type: text("type").notNull(), // "Dry Van", "Reefer", "Flatbed"
  pay: real("pay").notNull(), // Total load pay (gross revenue)
  miles: integer("miles").notNull(),
  
  // Driver compensation removed per user request
  isProfitable: integer("is_profitable").notNull(), // SQLite boolean as integer
  estimatedFuelCost: real("estimated_fuel_cost").notNull().default(0), // calculated fuel cost for this load
  estimatedGallons: real("estimated_gallons").notNull().default(0), // estimated gallons for this load
  status: text("status").notNull().default("pending"), // "pending", "in_transit", "delivered"
  
  // Location information
  originCity: text("origin_city"),
  originState: text("origin_state"),
  destinationCity: text("destination_city"), 
  destinationState: text("destination_state"),
  
  // Deadhead miles tracking
  deadheadFromCity: text("deadhead_from_city"), // Previous delivery location
  deadheadFromState: text("deadhead_from_state"),
  deadheadMiles: integer("deadhead_miles").notNull().default(0), // Non-revenue miles to pickup
  totalMilesWithDeadhead: integer("total_miles_with_deadhead").notNull().default(0), // loaded + deadhead miles
  
  // Date information
  pickupDate: timestamp("pickup_date"),
  deliveryDate: timestamp("delivery_date"),
  
  // Load details
  commodity: text("commodity"),
  weight: integer("weight"), // lbs
  
  // Broker information
  brokerName: text("broker_name"),
  brokerContact: text("broker_contact"),
  rateConfirmation: text("rate_confirmation"),
  
  // Fuel costs (actual vs estimated)
  actualFuelCost: real("actual_fuel_cost").notNull().default(0), // actual fuel purchased for this load
  actualGallons: real("actual_gallons").notNull().default(0), // actual gallons purchased for this load
  
  // Calculated fields
  ratePerMile: real("rate_per_mile").notNull().default(0),
  profit: real("profit").notNull().default(0),
  actualCostPerMile: real("actual_cost_per_mile").notNull().default(0), // calculated with actual fuel costs
  
  // Additional notes
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Load stops table for multi-pickup/delivery support
export const loadStops = pgTable("load_stops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loadId: varchar("load_id").references(() => loads.id).notNull(),
  stopNumber: integer("stop_number").notNull(), // 1, 2, 3, etc. for ordering
  stopType: text("stop_type").notNull(), // "pickup" or "delivery"
  
  // Location details
  city: text("city").notNull(),
  state: text("state").notNull(),
  address: text("address"),
  
  // Timing
  scheduledDate: timestamp("scheduled_date"),
  actualDate: timestamp("actual_date"),
  
  // Load details for this stop
  commodity: text("commodity"),
  weight: integer("weight"), // lbs for this stop
  pieces: integer("pieces"), // number of pieces/pallets
  
  // Contact information
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  
  // Special instructions
  instructions: text("instructions"),
  
  // Distance from previous stop
  milesFromPrevious: integer("miles_from_previous").notNull().default(0),
  
  // Status tracking
  status: text("status").notNull().default("pending"), // "pending", "arrived", "completed"
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Fuel purchases table for tracking actual fuel costs per load
export const fuelPurchases = pgTable("fuel_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loadId: varchar("load_id").references(() => loads.id),
  truckId: varchar("truck_id").references(() => trucks.id).notNull(),
  fuelType: text("fuel_type").notNull().default("diesel"), // "diesel" or "def"
  
  // Purchase details
  gallons: real("gallons").notNull(),
  pricePerGallon: real("price_per_gallon").notNull(),
  totalCost: real("total_cost").notNull(),
  
  // Location and timing
  stationName: text("station_name"),
  stationAddress: text("station_address"),
  purchaseDate: timestamp("purchase_date").notNull(),
  
  // Receipt tracking
  receiptNumber: text("receipt_number"),
  paymentMethod: text("payment_method"), // "fuel_card", "cash", "credit_card"
  
  // Additional details
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Multi-leg load planning for weekly advance planning
export const loadPlans = pgTable("load_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  truckId: varchar("truck_id").references(() => trucks.id).notNull(),
  driverId: varchar("driver_id").references(() => drivers.id),
  planName: text("plan_name").notNull(),
  totalMiles: integer("total_miles").notNull().default(0),
  totalRevenue: real("total_revenue").notNull().default(0),
  totalProfit: real("total_profit").notNull().default(0),
  estimatedDuration: integer("estimated_duration").notNull(), // hours
  status: text("status").notNull().default("draft"), // "draft", "active", "completed"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual legs within a load plan
export const loadPlanLegs = pgTable("load_plan_legs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loadPlanId: varchar("load_plan_id").references(() => loadPlans.id).notNull(),
  legNumber: integer("leg_number").notNull(), // 1-5 for ordering
  originCity: text("origin_city").notNull(),
  originState: text("origin_state").notNull(),
  destinationCity: text("destination_city").notNull(),
  destinationState: text("destination_state").notNull(),
  miles: integer("miles").notNull(),
  rate: real("rate").notNull(),
  ratePerMile: real("rate_per_mile").notNull(),
  pickupDate: timestamp("pickup_date").notNull(),
  deliveryDate: timestamp("delivery_date").notNull(),
  commodity: text("commodity"),
  weight: integer("weight"), // lbs
  brokerName: text("broker_name"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Drivers table for ELD-HOS integration
export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().default('45506370'),
  name: text("name").notNull(),
  cdlNumber: text("cdl_number").notNull().unique(),
  phone: text("phone"),
  email: text("email"),
  payPerMile: real("pay_per_mile").default(0.50), // Default pay per mile for driver (user can update)
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// ELD Hours of Service logs
export const hosLogs = pgTable("hos_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").references(() => drivers.id).notNull(),
  truckId: varchar("truck_id").references(() => trucks.id).notNull(),
  dutyStatus: text("duty_status").notNull(), // "ON_DUTY", "OFF_DUTY", "DRIVING", "SLEEPER_BERTH"
  timestamp: timestamp("timestamp").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  address: text("address"),
  driveTimeRemaining: real("drive_time_remaining"), // hours
  onDutyRemaining: real("on_duty_remaining"), // hours
  cycleHoursRemaining: real("cycle_hours_remaining"), // hours
  violations: text("violations").array(), // array of violation codes
  annotations: text("annotations"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Load board freight opportunities
export const loadBoard = pgTable("load_board", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loadBoardSource: text("load_board_source").notNull(), // "DAT", "Truckstop", "123Loadboard"
  externalId: text("external_id").notNull(),
  equipmentType: text("equipment_type").notNull(), // "Dry Van", "Reefer", "Flatbed"
  originCity: text("origin_city").notNull(),
  originState: text("origin_state").notNull(),
  destinationCity: text("destination_city").notNull(),
  destinationState: text("destination_state").notNull(),
  miles: integer("miles").notNull(),
  rate: real("rate").notNull(),
  ratePerMile: real("rate_per_mile").notNull(),
  pickupDate: timestamp("pickup_date"),
  deliveryDate: timestamp("delivery_date"),
  weight: integer("weight"), // lbs
  commodity: text("commodity"),
  brokerName: text("broker_name"),
  brokerMc: text("broker_mc"),
  status: text("status").notNull().default("available"), // "available", "assigned", "completed"
  createdAt: timestamp("created_at").defaultNow(),
});

// Fleet size categories for scaling metrics
export const fleetMetrics = pgTable("fleet_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fleetSize: text("fleet_size").notNull(), // "solo", "small", "medium", "large", "enterprise"
  totalTrucks: integer("total_trucks").notNull(),
  activeTrucks: integer("active_trucks").notNull(),
  totalDrivers: integer("total_drivers").notNull(),
  activeDrivers: integer("active_drivers").notNull(),
  totalLoads: integer("total_loads").notNull(),
  totalMiles: integer("total_miles").notNull(),
  totalRevenue: real("total_revenue").notNull(),
  avgCostPerMile: real("avg_cost_per_mile").notNull(),
  utilizationRate: real("utilization_rate").notNull(),
  reportDate: timestamp("report_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // "success", "warning", "info", "hos_violation", "load_assigned"
  relatedDriverId: varchar("related_driver_id").references(() => drivers.id),
  relatedTruckId: varchar("related_truck_id").references(() => trucks.id),
  relatedLoadId: varchar("related_load_id").references(() => loads.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTruckSchema = createInsertSchema(trucks).omit({
  id: true,
});

export const insertLoadSchema = createInsertSchema(loads).omit({
  id: true,
  createdAt: true,
}).extend({
  pickupDate: z.coerce.date().optional(),
  deliveryDate: z.coerce.date().optional(),
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  createdAt: true,
});

export const insertHosLogSchema = createInsertSchema(hosLogs).omit({
  id: true,
  createdAt: true,
}).extend({
  timestamp: z.coerce.date(),
});

// Fuel purchases schemas
export const insertFuelPurchaseSchema = createInsertSchema(fuelPurchases).omit({
  id: true,
  createdAt: true,
}).extend({
  purchaseDate: z.coerce.date(),
});

export const insertLoadBoardSchema = createInsertSchema(loadBoard).omit({
  id: true,
  createdAt: true,
});

export const insertFleetMetricsSchema = createInsertSchema(fleetMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertTruckCostBreakdownSchema = createInsertSchema(truckCostBreakdown).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  weekStarting: z.coerce.date(),
  weekEnding: z.coerce.date(),
});

export const insertLoadPlanSchema = createInsertSchema(loadPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLoadPlanLegSchema = createInsertSchema(loadPlanLegs).omit({
  id: true,
  createdAt: true,
});

export const insertLoadStopSchema = createInsertSchema(loadStops).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  scheduledDate: z.coerce.date().optional(),
  actualDate: z.coerce.date().optional(),
});

export type InsertTruck = z.infer<typeof insertTruckSchema>;
export type Truck = typeof trucks.$inferSelect;
export type InsertLoad = z.infer<typeof insertLoadSchema>;
export type Load = typeof loads.$inferSelect;
export type InsertLoadStop = z.infer<typeof insertLoadStopSchema>;
export type LoadStop = typeof loadStops.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;
export type InsertHosLog = z.infer<typeof insertHosLogSchema>;
export type HosLog = typeof hosLogs.$inferSelect;
export type InsertFuelPurchase = z.infer<typeof insertFuelPurchaseSchema>;
export type FuelPurchase = typeof fuelPurchases.$inferSelect;
export type InsertLoadBoard = z.infer<typeof insertLoadBoardSchema>;
export type LoadBoardItem = typeof loadBoard.$inferSelect;
export type InsertFleetMetrics = z.infer<typeof insertFleetMetricsSchema>;
export type FleetMetrics = typeof fleetMetrics.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertTruckCostBreakdown = z.infer<typeof insertTruckCostBreakdownSchema>;
export type TruckCostBreakdown = typeof truckCostBreakdown.$inferSelect;
export type InsertLoadPlan = z.infer<typeof insertLoadPlanSchema>;
export type LoadPlan = typeof loadPlans.$inferSelect;
export type InsertLoadPlanLeg = z.infer<typeof insertLoadPlanLegSchema>;
export type LoadPlanLeg = typeof loadPlanLegs.$inferSelect;

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  company: varchar("company"),
  title: varchar("title"),
  isAdmin: integer("is_admin").notNull().default(0), // SQLite boolean as integer: 0 = regular user, 1 = admin
  isFounder: integer("is_founder").notNull().default(0), // 0 = regular user, 1 = founder (highest access level)
  isActive: integer("is_active").notNull().default(1), // 0 = terminated, 1 = active
  terminatedAt: timestamp("terminated_at"),
  terminatedBy: varchar("terminated_by"),
  terminationReason: text("termination_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// User sessions table for tracking active sessions
export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionToken: varchar("session_token").notNull().unique(),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  isActive: integer("is_active").notNull().default(1),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Session audit logs for tracking user activities
export const sessionAuditLogs = pgTable("session_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => userSessions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action").notNull(), // login, logout, timeout, activity, admin_access, etc.
  endpoint: varchar("endpoint"), // API endpoint accessed
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  metadata: jsonb("metadata"), // Additional context data
  timestamp: timestamp("timestamp").defaultNow(),
});

// Relations for sessions
export const userSessionsRelations = relations(userSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
  auditLogs: many(sessionAuditLogs),
}));

export const sessionAuditLogsRelations = relations(sessionAuditLogs, ({ one }) => ({
  session: one(userSessions, {
    fields: [sessionAuditLogs.sessionId],
    references: [userSessions.id],
  }),
  user: one(users, {
    fields: [sessionAuditLogs.userId],
    references: [users.id],
  }),
}));

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;
export type SessionAuditLog = typeof sessionAuditLogs.$inferSelect;
export type InsertSessionAuditLog = typeof sessionAuditLogs.$inferInsert;

// Comprehensive analytics and data tracking tables
export const userAnalytics = pgTable("user_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Session tracking
  sessionId: varchar("session_id").notNull(),
  sessionStartTime: timestamp("session_start_time").notNull(),
  sessionEndTime: timestamp("session_end_time"),
  sessionDuration: integer("session_duration"), // seconds
  
  // Page/feature usage
  pagesVisited: text("pages_visited").array().default(sql`ARRAY[]::text[]`),
  featuresUsed: text("features_used").array().default(sql`ARRAY[]::text[]`),
  totalPageViews: integer("total_page_views").notNull().default(0),
  
  // Data interaction tracking
  trucksManaged: integer("trucks_managed").notNull().default(0),
  loadsCreated: integer("loads_created").notNull().default(0),
  driversManaged: integer("drivers_managed").notNull().default(0),
  fuelPurchasesRecorded: integer("fuel_purchases_recorded").notNull().default(0),
  
  // Business metrics
  totalRevenue: real("total_revenue").notNull().default(0),
  totalMiles: integer("total_miles").notNull().default(0),
  avgProfitPerLoad: real("avg_profit_per_load").notNull().default(0),
  fleetUtilization: real("fleet_utilization").notNull().default(0),
  
  // Device and browser info
  userAgent: text("user_agent"),
  deviceType: text("device_type"), // "desktop", "mobile", "tablet"
  browserName: text("browser_name"),
  operatingSystem: text("operating_system"),
  
  // Privacy control flags
  isPrivate: integer("is_private").notNull().default(1), // 1 = private by default, only user + founder can see
  allowAnalytics: integer("allow_analytics").notNull().default(1), // user consent for analytics collection
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Data input tracking for comprehensive metrics
export const dataInputTracking = pgTable("data_input_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Input classification
  inputType: text("input_type").notNull(), // "truck", "load", "driver", "fuel_purchase", "cost_breakdown"
  inputSubType: text("input_sub_type"), // "create", "update", "delete", "view"
  recordId: varchar("record_id").notNull(), // ID of the record being tracked
  
  // Data details
  dataCategory: text("data_category").notNull(), // "operational", "financial", "compliance", "planning"
  fieldName: text("field_name"), // specific field being modified
  previousValue: text("previous_value"), // for updates
  newValue: text("new_value"), // for creates/updates
  
  // Business impact
  impactLevel: text("impact_level").notNull().default("low"), // "low", "medium", "high", "critical"
  businessFunction: text("business_function").notNull(), // "fleet_management", "cost_control", "compliance", "planning"
  
  // Metadata
  ipAddress: varchar("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
  source: text("source").notNull().default("web_app"), // "web_app", "mobile_app", "api", "import"
  
  createdAt: timestamp("created_at").defaultNow(),
});

// System-wide metrics aggregation
export const systemMetrics = pgTable("system_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricDate: timestamp("metric_date").notNull(),
  
  // User engagement metrics
  totalActiveUsers: integer("total_active_users").notNull().default(0),
  newUsersToday: integer("new_users_today").notNull().default(0),
  averageSessionDuration: real("average_session_duration").notNull().default(0), // minutes
  totalSessions: integer("total_sessions").notNull().default(0),
  
  // Data volume metrics
  totalTrucksInSystem: integer("total_trucks_in_system").notNull().default(0),
  totalLoadsInSystem: integer("total_loads_in_system").notNull().default(0),
  totalDriversInSystem: integer("total_drivers_in_system").notNull().default(0),
  totalFuelPurchases: integer("total_fuel_purchases").notNull().default(0),
  
  // Business metrics
  totalFleetValue: real("total_fleet_value").notNull().default(0), // estimated fleet value
  totalRevenueTracked: real("total_revenue_tracked").notNull().default(0),
  totalMilesTracked: integer("total_miles_tracked").notNull().default(0),
  averageCostPerMile: real("average_cost_per_mile").notNull().default(0),
  
  // System performance
  apiRequestsToday: integer("api_requests_today").notNull().default(0),
  dataInputsToday: integer("data_inputs_today").notNull().default(0),
  systemErrors: integer("system_errors").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Feature usage analytics
export const featureAnalytics = pgTable("feature_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Feature identification
  featureName: text("feature_name").notNull(), // "truck_management", "load_entry", "analytics_dashboard"
  featureCategory: text("feature_category").notNull(), // "core", "analytics", "planning", "compliance"
  actionType: text("action_type").notNull(), // "view", "create", "edit", "delete", "export", "calculate"
  
  // Usage context
  timeSpent: integer("time_spent"), // seconds spent on feature
  successful: integer("successful").notNull().default(1), // 1 for success, 0 for failure/error
  errorMessage: text("error_message"), // if successful = 0
  
  // Business value
  valueGenerated: real("value_generated").default(0), // estimated business value (cost savings, revenue, etc.)
  efficiencyGain: real("efficiency_gain").default(0), // time saved in minutes
  
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for analytics tables
export const insertUserAnalyticsSchema = createInsertSchema(userAnalytics, {
  sessionStartTime: z.coerce.date(),
  sessionEndTime: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDataInputTrackingSchema = createInsertSchema(dataInputTracking, {
  timestamp: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertSystemMetricsSchema = createInsertSchema(systemMetrics, {
  metricDate: z.coerce.date(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertFeatureAnalyticsSchema = createInsertSchema(featureAnalytics, {
  timestamp: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
});

// Types for analytics
export type InsertUserAnalytics = z.infer<typeof insertUserAnalyticsSchema>;
export type UserAnalytics = typeof userAnalytics.$inferSelect;
export type InsertDataInputTracking = z.infer<typeof insertDataInputTrackingSchema>;
export type DataInputTracking = typeof dataInputTracking.$inferSelect;
export type InsertSystemMetrics = z.infer<typeof insertSystemMetricsSchema>;
export type SystemMetrics = typeof systemMetrics.$inferSelect;
export type InsertFeatureAnalytics = z.infer<typeof insertFeatureAnalyticsSchema>;
export type FeatureAnalytics = typeof featureAnalytics.$inferSelect;
