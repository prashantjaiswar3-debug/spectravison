
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Device, DeviceType, NVR, POESwitch } from "@/types"
import { getDeviceFormSchema, type DeviceFormValues } from "./schemas"
import { CameraForm } from "./CameraForm"
import { NvrForm } from "./NvrForm"
import { PoeSwitchForm } from "./PoeSwitchForm"
import { TvScreenForm } from "./TvScreenForm"

interface DeviceFormProps {
  deviceType: DeviceType;
  editingDevice: Device | null;
  onSubmit: (values: DeviceFormValues) => void;
  onCancel: () => void;
  nvrs: NVR[];
  poeSwitches: POESwitch[];
}

export function DeviceForm({
  deviceType,
  editingDevice,
  onSubmit,
  onCancel,
  nvrs,
  poeSwitches,
}: DeviceFormProps) {
  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(getDeviceFormSchema({ deviceType } as any)),
    defaultValues: {
      deviceType: deviceType,
    }
  })

  useEffect(() => {
    let defaultValues: Partial<DeviceFormValues>;
    
    if (editingDevice) {
      defaultValues = {
        ...editingDevice,
        deviceType: editingDevice.type,
        // Ensure optional number fields are reset to empty string if null/undefined
        switchPortNumber: 'switchPortNumber' in editingDevice && editingDevice.switchPortNumber ? editingDevice.switchPortNumber : '',
        uplinkPortCount: 'uplinkPortCount' in editingDevice && editingDevice.uplinkPortCount ? editingDevice.uplinkPortCount : '',
      } as any; 
    } else {
      defaultValues = {
        deviceType,
        name: '',
        location: '',
      };
      switch (deviceType) {
        case 'camera':
          defaultValues = { ...defaultValues, ipAddress: '', installationDate: new Date(), screenChannelNumber: 1, zone: '', poeSwitchId: '', poePortNumber: 1, cameraType: 'dome', quality: 4, nvrId: '', nvrChannelNumber: 1 };
          break;
        case 'nvr':
          defaultValues = { ...defaultValues, ipAddress: '', storageCapacity: '', channels: 16 };
          break;
        case 'poe':
          defaultValues = { ...defaultValues, portCount: 8, uplinkPortCount: '' };
          break;
        case 'tv':
          defaultValues = { ...defaultValues, size: 55, nvrId: '' };
          break;
      }
    }
    form.reset(defaultValues as any);
  }, [editingDevice, deviceType, form]);
  
  useEffect(() => {
    form.setValue('deviceType', deviceType);
  }, [deviceType, form]);

  const handleSubmit = (values: DeviceFormValues) => {
    onSubmit({ ...values, deviceType });
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <DialogHeader>
          <DialogTitle>{editingDevice ? `Edit ${deviceType.toUpperCase()}` : `Add New ${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)}`}</DialogTitle>
          <DialogDescription>
            {editingDevice
              ? `Update the details for ${editingDevice.name}.`
              : `Enter the details for the new ${deviceType}.`}
          </DialogDescription>
        </DialogHeader>

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

        {deviceType === 'camera' && <CameraForm nvrs={nvrs} poeSwitches={poeSwitches} />}
        {deviceType === 'nvr' && <NvrForm />}
        {deviceType === 'poe' && <PoeSwitchForm />}
        {deviceType === 'tv' && <TvScreenForm nvrs={nvrs} />}
        
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Save Device</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
