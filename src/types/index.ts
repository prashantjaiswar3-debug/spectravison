export type Camera = {
  id: string;
  name: string;
  ipAddress: string;
  location: string;
  installationDate: Date;
  status: 'active' | 'inactive';
  firmwareVersion: string;
};
