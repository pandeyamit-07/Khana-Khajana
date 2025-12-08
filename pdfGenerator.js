const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateOrderPDF = (order, filePath) => {
    const doc = new PDFDocument({ margin: 40 });

    // Save the PDF to the specified file path
    doc.pipe(fs.createWriteStream(filePath));

    // Header Section
    doc.fontSize(24).font('Helvetica-Bold').text("Khana Khajana", { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text("Address: Borivali East, 40009", { align: 'center' });
    doc.text("Mobile: 7498593746", { align: 'center' });
    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke(); // Horizontal line
    doc.moveDown(1);

    // Order Details Section
    doc.fontSize(14).font('Helvetica-Bold').text("Order Details", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`Order ID: ${order.order_id}`);
    doc.text(`Customer Name: ${order.customer_name}`);
    doc.text(`Mobile: ${order.mobile_num}`);
    doc.text(`Order Type: ${order.order_type}`);
    doc.text(`Order Status: ${order.order_status}`);
    doc.text(`Timestamp: ${order.timestamp}`);
    doc.moveDown(1);

    // Items Table Header
    doc.fontSize(14).font('Helvetica-Bold').text("Items", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text("Item Name", 50, doc.y, { continued: true });
    doc.text("Quantity", 200, doc.y, { continued: true });
    doc.text("Price", 300, doc.y, { continued: true });
    doc.text("Total", 400, doc.y);
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke(); // Horizontal line
    doc.moveDown(0.5);

    // Items Table Rows
    let totalAmount = 0;
    doc.font('Helvetica');
    order.items.forEach(item => {
        const itemTotal = item.count * item.price;
        totalAmount += itemTotal;

        doc.text(item.item_name, 50, doc.y, { continued: true });
        doc.text(item.count, 200, doc.y, { continued: true });
        doc.text(`₹${item.price.toFixed(2)}`, 300, doc.y, { continued: true });
        doc.text(`₹${itemTotal.toFixed(2)}`, 400, doc.y);
    });

    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke(); // Horizontal line
    doc.moveDown(1);

    // GST and Grand Total Section
    const gst = totalAmount * 0.05; // 5% GST
    const grandTotal = totalAmount + gst;

    doc.fontSize(12).font('Helvetica-Bold').text(`Subtotal: ₹${totalAmount.toFixed(2)}`, { align: 'right' });
    doc.text(`GST (5%): ₹${gst.toFixed(2)}`, { align: 'right' });
    doc.fontSize(14).text(`Grand Total: ₹${grandTotal.toFixed(2)}`, { align: 'right' });
    doc.moveDown(2);

    // Footer Section
    doc.fontSize(10).font('Helvetica-Oblique').text("Thank you for ordering with Khana Khajana!", { align: 'center' });
    doc.text("We hope to serve you again!", { align: 'center' });

    // Finalize the PDF
    doc.end();
};

module.exports = { generateOrderPDF };
