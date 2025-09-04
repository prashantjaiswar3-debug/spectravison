
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

export function PoeSwitchForm() {
  const form = useFormContext()
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FormField
            control={form.control}
            name="portCount"
            render={({ field }) => (
            <FormItem>
                <FormLabel>PoE Port Count</FormLabel>
                <FormControl>
                <Input type="number" placeholder="e.g., 8" {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="uplinkPortCount"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Uplink Port Count</FormLabel>
                <FormControl>
                <Input type="number" placeholder="e.g., 2" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
      </div>
    </>
  )
}
