export type DeviceStatus = 'active' | 'inactive' | 'error';
export type DeviceType = 'camera' | 'nvr' | 'poe' | 'tv';

export type Camera = {
  id: string;
  name: string;
  ipAddress: string;
  location: string;
  installationDate: Date;
  status: DeviceStatus;
  type: 'camera';
  screenChannelNumber: number;
  zone: string;
  poeSwitchId: string;
  poePortNumber: number;
  cameraType: 'bullet' | 'dome' | 'ptz';
  quality: number; // in megapixels
  nvrId: string;
  nvrChannelNumber: number;
};

export type NVR = {
  id: string;
  name: string;
  ipAddress: string;
  location: string;
  status: DeviceStatus;
  storageCapacity: string; // e.g., '8TB'
  channels: number;
  type: 'nvr';
  switchId?: string;
  switchPortNumber?: number;
};

export type POESwitch = {
  id: string;
  name: string;
  location: string;
  status: DeviceStatus;
  portCount: number;
  uplinkPortCount?: number;
  type: 'poe';
  derivedStatus?: DeviceStatus;
  hasInactiveCameras?: boolean;
};

export type TVScreen = {
  id: string;
  name: string;
  location: string;
  size: number; // e.g., 55
  type: 'tv';
  nvrId: string;
};

export type Device = (Camera | NVR | POESwitch | TVScreen) & { status?: DeviceStatus };
