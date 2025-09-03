"use client"

import { useFormContext } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import type { POESwitch } from "@/types"

interface NvrFormProps {
  poeSwitches: POESwitch[];
}

export function NvrForm({ poeSwitches }: NvrFormProps) {
  const form = useFormContext()
  return (
    <>
      <FormField
        control={form.control}
        name="ipAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>IP Address</FormLabel>
            <FormControl>
              <Input placeholder="e.g., 192.168.1.50" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="storageCapacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Storage Capacity</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 16TB" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="channels"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Channels</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 16" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField
            control={form.control}
            name="switchId"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Switch</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select a switch" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {poeSwitches.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="switchPortNumber"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Switch Port</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="e.g., 8" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
      </div>
    </>
  )
}
