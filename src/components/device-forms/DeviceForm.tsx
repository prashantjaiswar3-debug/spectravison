"use client"

import { useEffect } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Device, DeviceType, NVR, POESwitch } from "@/types"
import { deviceFormSchema, type DeviceFormValues } from "./schemas"
import { CameraForm } from "./CameraForm"
import { NvrForm } from "./NvrForm"
import { PoeSwitchForm } from "./PoeSwitchForm"
import { TvScreenForm } from "./TvScreenForm"

interface DeviceFormProps {
  deviceType: DeviceType;
  onDeviceTypeChange: (type: DeviceType) => void;
  editingDevice: Device | null;
  onSubmit: (values: DeviceFormValues) => void;
  onCancel: () => void;
  nvrs: NVR[];
  poeSwitches: POESwitch[];
}

export function DeviceForm({
  deviceType,
  onDeviceTypeChange,
  editingDevice,
  onSubmit,
  onCancel,
  nvrs,
  poeSwitches,
}: DeviceFormProps) {
  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      deviceType: 'camera',
      name: '',
      location: '',
    },
  })

  useEffect(() => {
    if (editingDevice) {
      const defaultValues: Partial<DeviceFormValues> = {
        ...editingDevice,
      };
      // Ensure optional numeric fields are not undefined for controlled components
      if (editingDevice.type === 'nvr') {
        defaultValues.switchPortNumber = editingDevice.switchPortNumber ?? '' as any;
      }
      if (editingDevice.type === 'poe') {
        defaultValues.uplinkPortCount = editingDevice.uplinkPortCount ?? '' as any;
      }
      form.reset(defaultValues as any);
    } else {
      const defaultValues: Partial<DeviceFormValues> = {
        name: '',
        location: '',
      };
      // Reset with specific fields for the selected type to avoid lingering values
      switch (deviceType) {
        case 'camera':
          form.reset({ ...defaultValues, deviceType, ipAddress: '', installationDate: new Date(), screenChannelNumber: 1, zone: '', poeSwitchId: '', poePortNumber: 1, cameraType: 'dome', quality: 4, nvrId: '', nvrChannelNumber: 1 });
          break;
        case 'nvr':
          form.reset({ ...defaultValues, deviceType, ipAddress: '', storageCapacity: '', channels: 16, switchId: '', switchPortNumber: '' as any });
          break;
        case 'poe':
          form.reset({ ...defaultValues, deviceType, portCount: 8, uplinkPortCount: '' as any });
          break;
        case 'tv':
          form.reset({ ...defaultValues, deviceType, size: 55, nvrId: '' });
          break;
        default:
          form.reset({ deviceType: 'camera', name: '', location: '' });
      }
    }
  }, [editingDevice, form, deviceType]);
  
  const currentDeviceType = form.watch('deviceType');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <DialogHeader>
          <DialogTitle>{editingDevice ? 'Edit Device' : 'Add New Device'}</DialogTitle>
          <DialogDescription>
            {editingDevice
              ? 'Update the details for this device.'
              : 'Select a device type and enter its details.'}
          </DialogDescription>
        </DialogHeader>

        <FormField
          control={form.control}
          name="deviceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Device Type</FormLabel>
              <Select onValueChange={(value) => { field.onChange(value); onDeviceTypeChange(value as DeviceType); }} value={field.value} disabled={!!editingDevice}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a device type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="camera">Camera</SelectItem>
                  <SelectItem value="nvr">NVR</SelectItem>
                  <SelectItem value="poe">PoE Switch</SelectItem>
                  <SelectItem value="tv">TV Screen</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Device Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Lobby Entrance Cam" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Main Building, 1st Floor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {currentDeviceType === 'camera' && <CameraForm nvrs={nvrs} poeSwitches={poeSwitches} />}
        {currentDeviceType === 'nvr' && <NvrForm poeSwitches={poeSwitches} />}
        {currentDeviceType === 'poe' && <PoeSwitchForm />}
        {currentDeviceType === 'tv' && <TvScreenForm nvrs={nvrs} />}
        
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Save Device</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
