
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
import { deviceFormSchema, type DeviceFormValues } from "./schemas"
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
    resolver: zodResolver(deviceFormSchema),
  })

  useEffect(() => {
    let defaultValues: Partial<DeviceFormValues>;
    
    if (editingDevice) {
      defaultValues = {
        ...editingDevice,
        switchPortNumber: editingDevice.type === 'nvr' ? editingDevice.switchPortNumber ?? '' : undefined,
        uplinkPortCount: editingDevice.type === 'poe' ? editingDevice.uplinkPortCount ?? '' : undefined,
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
          defaultValues = { ...defaultValues, ipAddress: '', storageCapacity: '', channels: 16, switchId: '', switchPortNumber: '', details: '' };
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
    // This is necessary to set the deviceType for validation purposes,
    // even though the field is not visible in the UI.
    form.setValue('deviceType', deviceType);
  }, [deviceType, form]);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
        {deviceType === 'nvr' && <NvrForm poeSwitches={poeSwitches} />}
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
