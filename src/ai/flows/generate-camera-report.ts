'use server';

/**
 * @fileOverview An AI agent for generating camera reports.
 *
 * - generateCameraReport - A function that handles the generation of camera reports.
 * - GenerateCameraReportInput - The input type for the generateCameraReport function.
 * - GenerateCameraReportOutput - The return type for the generateCameraReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCameraReportInputSchema = z.object({
  cameraData: z.string().describe('A stringified JSON array of camera objects, each containing details like name, IP address, location, status, quality, camera type, and zone.'),
});
export type GenerateCameraReportInput = z.infer<typeof GenerateCameraReportInputSchema>;

const GenerateCameraReportOutputSchema = z.object({
  report: z.string().describe('A detailed report analyzing the camera data, highlighting cameras requiring attention or upgrades.'),
});
export type GenerateCameraReportOutput = z.infer<typeof GenerateCameraReportOutputSchema>;

export async function generateCameraReport(input: GenerateCameraReportInput): Promise<GenerateCameraReportOutput> {
  return generateCameraReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCameraReportPrompt',
  input: {schema: GenerateCameraReportInputSchema},
  output: {schema: GenerateCameraReportOutputSchema},
  prompt: `You are an expert security system administrator. Analyze the provided CCTV camera data and generate a report that highlights cameras requiring attention or upgrades. The 'installationDate' field is not provided in the data, so do not mention it in your report.

Camera Data: {{{cameraData}}}

Report:`,
});

const generateCameraReportFlow = ai.defineFlow(
  {
    name: 'generateCameraReportFlow',
    inputSchema: GenerateCameraReportInputSchema,
    outputSchema: GenerateCameraReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
