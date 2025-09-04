import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const cameras = sqliteTable("cameras", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ipAddress: text("ip_address").notNull(),
  location: text("location").notNull(),
  installationDate: integer("installation_date", { mode: "timestamp" }).notNull(),
  status: text("status", { enum: ["active", "inactive", "error"] }).notNull(),
  screenChannelNumber: integer("screen_channel_number").notNull(),
  zone: text("zone").notNull(),
  poeSwitchId: text("poe_switch_id").notNull(),
  poePortNumber: integer("poe_port_number").notNull(),
  cameraType: text("camera_type", { enum: ["bullet", "dome", "ptz"] }).notNull(),
  quality: integer("quality").notNull(),
  nvrId: text("nvr_id").notNull(),
  nvrChannelNumber: integer("nvr_channel_number").notNull(),
});

export const nvrs = sqliteTable("nvrs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ipAddress: text("ip_address").notNull(),
  location: text("location").notNull(),
  status: text("status", { enum: ["active", "inactive", "error"] }).notNull(),
  storageCapacity: text("storage_capacity").notNull(),
  channels: integer("channels").notNull(),
});

export const poeSwitches = sqliteTable("poe_switches", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  status: text("status", { enum: ["active", "inactive", "error"] }).notNull(),
  portCount: integer("port_count").notNull(),
  uplinkPortCount: integer("uplink_port_count"),
});

export const tvScreens = sqliteTable("tv_screens", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    location: text("location").notNull(),
    size: integer("size").notNull(),
    nvrId: text("nvr_id").notNull(),
});