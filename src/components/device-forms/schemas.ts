
"use client"

import * as z from 'zod';

const baseDeviceSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  location: z.string().min(2, { message: 'Location must be at least 2 characters.' }),
});

export const deviceFormSchema = z.discriminatedUnion('deviceType', [
  baseDeviceSchema.extend({
    deviceType: z.literal('camera'),
    ipAddress: z.string().ip({ version: 'v4', message: 'Invalid IPv4 address.' }),
    installationDate: z.date({ required_error: 'An installation date is required.' }),
    screenChannelNumber: z.coerce.number().int().min(1, { message: 'Channel number must be at least 1.' }),
    zone: z.string().min(1, { message: 'Zone is required.' }),
    poeSwitchId: z.string().min(1, { message: 'A PoE switch must be selected.' }),
    poePortNumber: z.coerce.number().int().min(1, { message: 'PoE port number must be at least 1.' }),
    cameraType: z.enum(['bullet', 'dome', 'ptz'], { required_error: 'Camera type is required.' }),
    quality: z.coerce.number().int().min(1, 'Quality must be at least 1MP.').max(15, 'Quality cannot exceed 15MP.'),
    nvrId: z.string().min(1, { message: 'An NVR must be selected.' }),
    nvrChannelNumber: z.coerce.number().int().min(1, { message: 'NVR channel number must be at least 1.' }),
  }),
  baseDeviceSchema.extend({
    deviceType: z.literal('nvr'),
    ipAddress: z.string().ip({ version: 'v4', message: 'Invalid IPv4 address.' }),
    storageCapacity: z.string().min(1, { message: 'Storage capacity is required.' }),
    channels: z.coerce.number().int().min(1, { message: 'Channels must be at least 1.' }),
    switchId: z.string().optional().or(z.literal('')),
    switchPortNumber: z.coerce.number().int().min(1).optional().or(z.literal('')),
  }).refine(data => {
    // If switchId is provided, switchPortNumber must also be provided
    if (data.switchId && !data.switchPortNumber) {
      return false;
    }
    return true;
  }, {
    message: "Port number is required when a switch is selected.",
    path: ["switchPortNumber"],
  }),
  baseDeviceSchema.extend({
    deviceType: z.literal('poe'),
    portCount: z.coerce.number().int().min(1, { message: 'PoE port count must be at least 1.' }),
    uplinkPortCount: z.coerce.number().int().min(0).optional().or(z.literal('')),
  }),
  baseDeviceSchema.extend({
    deviceType: z.literal('tv'),
    size: z.coerce.number().int().min(1, { message: 'Screen size must be positive.' }),
    nvrId: z.string().min(1, { message: 'An NVR must be selected.' }),
  }),
]);

export type DeviceFormValues = z.infer<typeof deviceFormSchema>;
