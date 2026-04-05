'use server';
/**
 * @fileOverview An OCR verification service for payment screenshots.
 *
 * - ocrVerify - A function that takes a screenshot and order details,
 *   and returns a structured verification result.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const OcrVerifyInputSchema = z.object({
  screenshotDataUri: z
    .string()
    .describe(
      "A screenshot of a UPI payment confirmation, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  expectedUtr: z.string().describe('The 12-digit UTR number that the user entered.'),
  expectedAmount: z.number().describe('The expected payment amount in INR.'),
  expectedReceiverUpi: z.string().describe('The UPI ID of the payment receiver.'),
});

export type OcrVerifyInput = z.infer<typeof OcrVerifyInputSchema>;

const OcrVerifyOutputSchema = z.object({
  amountMatch: z.boolean().describe('True if the OCR-extracted amount exactly matches the expected amount.'),
  utrMatch: z.boolean().describe('True if the OCR-extracted UTR or reference number exactly matches the expected UTR.'),
  upiMatch: z.boolean().describe('True if the OCR-extracted receiver UPI ID partially contains the expected receiver UPI ID.'),
  dateMatch: z.boolean().describe('True if the current date (in DD MMM or similar format) is found in the OCR text.'),
  statusMatch: z.boolean().describe('True if keywords like "Paid", "Successful", or "Completed" are found in the OCR text.'),
  rawText: z.string().describe('The full, raw text extracted from the screenshot.'),
});

export type OcrVerifyOutput = z.infer<typeof OcrVerifyOutputSchema>;

const ocrPrompt = ai.definePrompt({
    name: 'ocrVerifyPrompt',
    input: { schema: OcrVerifyInputSchema },
    output: { schema: OcrVerifyOutputSchema },
    prompt: `
      You are a highly specialized OCR assistant for an Indian payment application. Your task is to analyze a UPI payment screenshot and verify its details against the expected values.

      **CRITICAL INSTRUCTIONS:**
      1.  **Analyze the Image:** The user will provide an image of a payment confirmation screenshot.
          - Screenshot: {{media url=screenshotDataUri}}

      2.  **Extract ALL text** from the image. Pay close attention to numbers, dates, names, and reference IDs.

      3.  **Compare with Expected Values:**
          - Expected Amount: {{{expectedAmount}}}
          - Expected UTR/Reference ID: {{{expectedUtr}}}
          - Expected Receiver UPI ID: {{{expectedReceiverUpi}}}
          - Expected Date: Today's date, which is ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}.

      4.  **Perform Verification and set the JSON output fields:**
          - **amountMatch:** Find the primary paid amount in the text. It must be an **exact numeric match** with the expected amount.
          - **utrMatch:** Find a 12-digit number labeled "UTR", "Reference No", "Transaction ID", or similar. It must be an **exact string match** with the expected UTR.
          - **upiMatch:** Find the recipient's UPI ID. It must **contain** the expected receiver UPI ID. A partial match is acceptable (e.g., extracted 'user@ybl' matches expected 'user@ybl').
          - **dateMatch:** Check if today's date (e.g., "${new Date().getDate()} ${new Date().toLocaleString('en-US', { month: 'short' })}") is present anywhere in the text.
          - **statusMatch:** Search the entire text for success keywords like "Paid", "Successful", "Completed", "Success", "Payment Successful". If any are found, set to true.
          - **rawText:** Return the complete, unaltered text extracted from the image.

      5.  **Output Format:** You MUST return a valid JSON object matching the output schema. Do not add any extra explanations or text outside the JSON structure.
    `,
});


export async function ocrVerify(input: OcrVerifyInput): Promise<OcrVerifyOutput | null> {
    try {
        const { output } = await ocrPrompt(input);
        return output;
    } catch (error) {
        console.error("OCR verification flow failed:", error);
        return null;
    }
}
