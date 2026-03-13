/**
 * Label Generation Service
 *
 * Generates shipping labels with barcodes and QR codes as PDF files
 */

import { injectable } from 'tsyringe';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import bwipjs from 'bwip-js';
import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';
import { Order, ShippingLabel, Address, ApiResponse } from '@/types';
import { getCarrierByCode, SENDER_ADDRESS } from '@/config/carriers';

interface LabelData {
  trackingNumber: string;
  carrierCode: string;
  carrierName: string;
  carrierLogo?: string;
  colorScheme: string;
  senderAddress: Address;
  recipientAddress: Address;
  packageWeight: number;
  serviceName: string;
  orderNumber: string;
}

@injectable()
export class LabelGenerationService {
  private readonly labelsDirectory = path.join(process.cwd(), 'public', 'shipping-labels');

  /**
   * Generate a shipping label for an order
   */
  async generateLabel(
    order: Order,
    trackingNumber: string
  ): Promise<ApiResponse<ShippingLabel>> {
    try {
      // Get carrier information from order.carrier, fallback to default
      const carrierCode = order.carrier || 'POSTNORD';
      const carrier = getCarrierByCode(carrierCode);
      if (!carrier) {
        return {
          success: false,
          error: `Unknown carrier: ${carrierCode}`,
        };
      }

      // Prepare label data
      const labelData: LabelData = {
        trackingNumber,
        carrierCode: carrier.code,
        carrierName: carrier.name,
        colorScheme: carrier.colorScheme,
        senderAddress: SENDER_ADDRESS,
        recipientAddress: order.shippingAddress,
        packageWeight: await this.calculateOrderWeight(order),
        // order.carrier holds the carrier code (e.g. 'POSTNORD'), not a service
        // name — use the first service name from config as the display value.
        serviceName: carrier.services[0].name,
        orderNumber: order.id,
      };

      // Generate barcode and QR code as raw PNG buffers
      const barcodeBuffer = await this.generateBarcode(trackingNumber);
      const qrCodeBuffer = await this.generateQRCode(trackingNumber, carrier.code);

      // Generate PDF
      const pdfBytes = await this.generatePDF(labelData, barcodeBuffer, qrCodeBuffer);

      // Save PDF to file system
      const labelFileName = `${order.id}.pdf`;
      const labelUrl = await this.savePDF(labelFileName, pdfBytes);

      const shippingLabel: ShippingLabel = {
        id: crypto.randomUUID(),
        orderId: order.id,
        trackingNumber,
        carrierCode: carrier.code,
        labelPdfUrl: labelUrl,
        barcodeData: `data:image/png;base64,${barcodeBuffer.toString('base64')}`,
        qrCodeData: `data:image/png;base64,${qrCodeBuffer.toString('base64')}`,
        generatedAt: new Date(),
      };

      return {
        success: true,
        data: shippingLabel,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate label: ${error}`,
      };
    }
  }

  /**
   * Generate PDF label (4x6 inch thermal label)
   */
  private async generatePDF(
    labelData: LabelData,
    barcodeBuffer: Buffer,
    qrCodeBuffer: Buffer
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([288, 432]); // 4x6 inches at 72 DPI

    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Header Section with Carrier Branding
    const bgColor = this.hexToRgb(labelData.colorScheme);
    page.drawRectangle({
      x: 0,
      y: 372,
      width: 288,
      height: 60,
      color: rgb(bgColor.r, bgColor.g, bgColor.b),
    });

    page.drawText(labelData.carrierName, {
      x: 20,
      y: 395,
      size: 20,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(labelData.serviceName, {
      x: 20,
      y: 378,
      size: 10,
      font: helvetica,
      color: rgb(0, 0, 0),
    });

    // Tracking Number
    page.drawText('TRACKING NUMBER', {
      x: 20,
      y: 355,
      size: 8,
      font: helvetica,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(labelData.trackingNumber, {
      x: 20,
      y: 335,
      size: 18,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    // Barcode
    const barcodeImage = await pdfDoc.embedPng(barcodeBuffer);
    page.drawImage(barcodeImage, {
      x: 20,
      y: 265,
      width: 248,
      height: 60,
    });

    // Sender Address
    page.drawText('FRÅN:', {
      x: 20,
      y: 245,
      size: 10,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    const senderLines = this.formatAddress(labelData.senderAddress);
    let senderY = 230;
    for (const line of senderLines) {
      page.drawText(line, {
        x: 20,
        y: senderY,
        size: 9,
        font: helvetica,
        color: rgb(0, 0, 0),
      });
      senderY -= 12;
    }

    // Separator Line
    page.drawLine({
      start: { x: 20, y: senderY - 5 },
      end: { x: 268, y: senderY - 5 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Recipient Address (Larger, more prominent)
    page.drawText('TILL:', {
      x: 20,
      y: senderY - 20,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    const recipientLines = this.formatAddress(labelData.recipientAddress);
    let recipientY = senderY - 38;
    for (const line of recipientLines) {
      page.drawText(line, {
        x: 20,
        y: recipientY,
        size: 11,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      recipientY -= 14;
    }

    // QR Code for Tracking
    const qrCodeImage = await pdfDoc.embedPng(qrCodeBuffer);
    page.drawImage(qrCodeImage, {
      x: 200,
      y: 20,
      width: 68,
      height: 68,
    });

    // Package Details
    page.drawText(`Vikt: ${labelData.packageWeight.toFixed(2)} kg`, {
      x: 20,
      y: 80,
      size: 9,
      font: helvetica,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Order: ${labelData.orderNumber.slice(0, 8)}...`, {
      x: 20,
      y: 65,
      size: 9,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });

    page.drawText('Scan for tracking >>', {
      x: 130,
      y: 30,
      size: 8,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Footer
    page.drawText('Fortune Essence AB | www.fortuneessence.se', {
      x: 20,
      y: 10,
      size: 7,
      font: helvetica,
      color: rgb(0.6, 0.6, 0.6),
    });

    return await pdfDoc.save();
  }

  /**
   * Generate Code 128 barcode
   */
  private async generateBarcode(trackingNumber: string): Promise<Buffer> {
    return bwipjs.toBuffer({
      bcid: 'code128',
      text: trackingNumber,
      scale: 3,
      height: 10,
      includetext: false,
      textxalign: 'center',
    });
  }

  /**
   * Generate QR code with tracking URL
   */
  private async generateQRCode(trackingNumber: string, carrierCode: string): Promise<Buffer> {
    const trackingUrl = `https://www.fortuneessence.se/tracking?number=${encodeURIComponent(trackingNumber)}&carrier=${encodeURIComponent(carrierCode)}`;
    return QRCode.toBuffer(trackingUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  }

  /**
   * Save PDF to file system
   */
  private async savePDF(fileName: string, pdfBytes: Uint8Array): Promise<string> {
    // Validate file name to prevent directory traversal
    const sanitizedFileName = path.basename(fileName);
    if (sanitizedFileName !== fileName) {
      throw new Error('Invalid file name: directory traversal detected');
    }

    // { recursive: true } is idempotent — no error if directory already exists
    await fs.mkdir(this.labelsDirectory, { recursive: true });

    const filePath = path.join(this.labelsDirectory, sanitizedFileName);

    try {
      await fs.writeFile(filePath, pdfBytes);
    } catch (writeError) {
      const err = writeError as NodeJS.ErrnoException;
      if (err.code === 'ENOSPC') {
        throw new Error('Insufficient disk space to save shipping label');
      } else if (err.code === 'EACCES') {
        throw new Error('Permission denied: cannot write to labels directory');
      }
      throw new Error(`Failed to write PDF file: ${err.message ?? String(err)}`);
    }

    return `/shipping-labels/${sanitizedFileName}`;
  }

  /**
   * Calculate total weight of order
   * TODO: Fetch actual product weights from database
   */
  private async calculateOrderWeight(order: Order): Promise<number> {
    // Calculate weight from order items if productId and weight are available
    // Otherwise use estimated weight per item
    let totalWeight = 0;

    for (const item of order.items) {
      // If item has weight information, use it
      if (item.weight) {
        totalWeight += item.weight * item.quantity;
      } else {
        // Fallback: estimate 0.5kg per item
        totalWeight += 0.5 * item.quantity;
      }
    }

    return totalWeight > 0 ? totalWeight : 0.5; // Minimum 0.5kg
  }

  /**
   * Format address for label
   */
  private formatAddress(address: Address): string[] {
    const lines: string[] = [];

    if (address.firstName || address.lastName) {
      lines.push(`${address.firstName || ''} ${address.lastName || ''}`.trim());
    }

    lines.push(address.street);
    lines.push(`${address.postalCode} ${address.city}`);

    if (address.country && address.country !== 'Sweden') {
      lines.push(address.country.toUpperCase());
    }

    return lines;
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      return { r: 0.9, g: 0.9, b: 0.9 }; // Default light grey
    }

    return {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
    };
  }
}
