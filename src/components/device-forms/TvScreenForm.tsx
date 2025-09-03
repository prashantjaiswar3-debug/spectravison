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
import type { NVR } from "@/types"

interface TvScreenFormProps {
  nvrs: NVR[];
}

export function TvScreenForm({ nvrs }: TvScreenFormProps) {
  const form = useFormContext()
  return (
    <>
      <FormField
        control={form.control}
        name="size"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Screen Size (inches)</FormLabel>
            <FormControl>
              <Input type="number" placeholder="e.g., 55" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="nvrId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Associated NVR</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select an NVR" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {nvrs.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
