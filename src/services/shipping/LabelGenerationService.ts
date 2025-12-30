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
        serviceName: order.carrier || carrier.services[0].name,
        orderNumber: order.id,
      };

      // Generate barcode
      const barcodeData = await this.generateBarcode(trackingNumber);

      // Generate QR code
      const qrCodeData = await this.generateQRCode(trackingNumber, carrier.code);

      // Generate PDF
      const pdfBytes = await this.generatePDF(labelData, barcodeData, qrCodeData);

      // Save PDF to file system
      const labelFileName = `${order.id}.pdf`;
      const labelUrl = await this.savePDF(labelFileName, pdfBytes);

      const shippingLabel: ShippingLabel = {
        id: '', // Will be set by repository
        orderId: order.id,
        trackingNumber,
        carrierCode: carrier.code,
        labelPdfUrl: labelUrl,
        barcodeData,
        qrCodeData,
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
    barcodeDataUrl: string,
    qrCodeDataUrl: string
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
    try {
      const barcodeImage = await pdfDoc.embedPng(barcodeDataUrl);
      page.drawImage(barcodeImage, {
        x: 20,
        y: 265,
        width: 248,
        height: 60,
      });
    } catch (error) {
      console.error('Failed to embed barcode:', error);
    }

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
    try {
      const qrCodeImage = await pdfDoc.embedPng(qrCodeDataUrl);
      page.drawImage(qrCodeImage, {
        x: 200,
        y: 20,
        width: 68,
        height: 68,
      });
    } catch (error) {
      console.error('Failed to embed QR code:', error);
    }

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

    page.drawText('Scan för spårning →', {
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
  private async generateBarcode(trackingNumber: string): Promise<string> {
    try {
      const png = await bwipjs.toBuffer({
        bcid: 'code128',
        text: trackingNumber,
        scale: 3,
        height: 10,
        includetext: false,
        textxalign: 'center',
      });

      return `data:image/png;base64,${png.toString('base64')}`;
    } catch (error) {
      console.error('Barcode generation error:', error);
      // Return a placeholder
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }
  }

  /**
   * Generate QR code with tracking URL
   */
  private async generateQRCode(trackingNumber: string, carrierCode: string): Promise<string> {
    try {
      const trackingUrl = `https://www.fortuneessence.se/tracking?number=${trackingNumber}&carrier=${carrierCode}`;
      return await QRCode.toDataURL(trackingUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } catch (error) {
      console.error('QR code generation error:', error);
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }
  }

  /**
   * Save PDF to file system
   */
  private async savePDF(fileName: string, pdfBytes: Uint8Array): Promise<string> {
    try {
      // Ensure directory exists with proper error handling
      try {
        await fs.mkdir(this.labelsDirectory, { recursive: true });
      } catch (mkdirError: any) {
        if (mkdirError.code !== 'EEXIST') {
          throw new Error(`Failed to create labels directory: ${mkdirError.message}`);
        }
      }

      // Validate file name to prevent directory traversal
      const sanitizedFileName = path.basename(fileName);
      if (sanitizedFileName !== fileName) {
        throw new Error('Invalid file name: directory traversal detected');
      }

      // Save file with proper error handling
      const filePath = path.join(this.labelsDirectory, sanitizedFileName);

      try {
        await fs.writeFile(filePath, pdfBytes);
      } catch (writeError: any) {
        if (writeError.code === 'ENOSPC') {
          throw new Error('Insufficient disk space to save shipping label');
        } else if (writeError.code === 'EACCES') {
          throw new Error('Permission denied: cannot write to labels directory');
        }
        throw new Error(`Failed to write PDF file: ${writeError.message}`);
      }

      // Verify file was written successfully
      try {
        await fs.access(filePath);
      } catch {
        throw new Error('PDF file was not saved successfully');
      }

      // Return public URL
      return `/shipping-labels/${sanitizedFileName}`;
    } catch (error: any) {
      console.error('Error saving shipping label PDF:', error);
      throw new Error(`Failed to save PDF: ${error.message || error}`);
    }
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
      return { r: 1, g: 1, b: 0 }; // Default yellow
    }

    return {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
    };
  }
}
