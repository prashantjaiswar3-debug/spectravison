
"use client"

import { useFormContext } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

export function NvrForm() {
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
              <FormLabel>Storage</FormLabel>
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
    </>
  )
}
