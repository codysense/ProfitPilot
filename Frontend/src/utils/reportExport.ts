import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export class ReportExporter {
  static async exportToPDF(elementId: string, filename: string, title: string) {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Report element not found');
      }

      // Create canvas from HTML element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calculate dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, pdfWidth / 2, 20, { align: 'center' });

      // Add image
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Add footer
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on ${new Date().toLocaleString()}`, 10, pdfHeight - 10);
      pdf.text('ProfitPilot ERP System', pdfWidth - 10, pdfHeight - 10, { align: 'right' });

      // Save PDF
      pdf.save(filename);
    } catch (error) {
      console.error('PDF export error:', error);
      throw new Error('Failed to export PDF');
    }
  }

  static exportToCSV(data: any[], columns: any[], filename: string) {
    try {
      // Create CSV headers
      const headers = columns.map(col => col.header);
      
      // Create CSV rows
      const rows = data.map(item => {
        return columns.map(col => {
          let value = '';
          
          if (col.cell && typeof col.cell === 'function') {
            // For custom cell renderers, extract the raw value
            const cellResult = col.cell(item);
            if (typeof cellResult === 'string') {
              value = cellResult;
            } else if (cellResult && cellResult.props && cellResult.props.children) {
              value = cellResult.props.children;
            } else {
              value = this.getNestedValue(item, col.key);
            }
          } else {
            value = this.getNestedValue(item, col.key);
          }
          
          // Clean up value for CSV
          if (typeof value === 'number') {
            return value.toString();
          } else if (typeof value === 'string') {
            // Remove currency symbols and commas for numeric values
            return value.replace(/[₦,]/g, '').trim();
          } else {
            return String(value || '');
          }
        });
      });

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('CSV export error:', error);
      throw new Error('Failed to export CSV');
    }
  }

  static exportToExcel(data: any[], columns: any[], filename: string) {
    // For now, export as CSV with .xlsx extension
    // In a full implementation, you would use a library like xlsx
    this.exportToCSV(data, columns, filename.replace('.xlsx', '.csv'));
  }

  private static getNestedValue(obj: any, path: string): any {
    if (!path || !obj) return '';
    
    if (path.includes('.')) {
      const keys = path.split('.');
      let value = obj;
      for (const key of keys) {
        value = value?.[key];
        if (value === undefined || value === null) break;
      }
      return value;
    }
    
    return obj[path];
  }

  // Specific export methods for different report types
  static async exportBalanceSheet(data: any, format: 'pdf' | 'csv' | 'xlsx') {
    const filename = `balance-sheet-${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'pdf') {
      await this.exportToPDF('balance-sheet-content', filename, 'Balance Sheet');
    } else {
      // Create flattened data for CSV/Excel
      const flatData = [
        ...data.assets?.map((item: any) => ({ ...item, category: 'Assets' })) || [],
        ...data.liabilities?.map((item: any) => ({ ...item, category: 'Liabilities' })) || [],
        ...data.equity?.map((item: any) => ({ ...item, category: 'Equity' })) || []
      ];
      
      const columns = [
        { key: 'category', header: 'Category' },
        { key: 'accountCode', header: 'Account Code' },
        { key: 'accountName', header: 'Account Name' },
        { key: 'balance', header: 'Balance' }
      ];
      
      if (format === 'csv') {
        this.exportToCSV(flatData, columns, filename);
      } else {
        this.exportToExcel(flatData, columns, filename);
      }
    }
  }

  static async exportProfitLoss(data: any, format: 'pdf' | 'csv' | 'xlsx') {
    const filename = `profit-loss-${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'pdf') {
      await this.exportToPDF('profit-loss-content', filename, 'Profit & Loss Statement');
    } else {
      const flatData = [
        ...data.revenues?.map((item: any) => ({ ...item, category: 'Revenue' })) || [],
        ...data.expenses?.map((item: any) => ({ ...item, category: 'Expense' })) || []
      ];
      
      const columns = [
        { key: 'category', header: 'Category' },
        { key: 'accountCode', header: 'Account Code' },
        { key: 'accountName', header: 'Account Name' },
        { key: 'amount', header: 'Amount' }
      ];
      
      if (format === 'csv') {
        this.exportToCSV(flatData, columns, filename);
      } else {
        this.exportToExcel(flatData, columns, filename);
      }
    }
  }

  static async exportGenericReport(
    data: any[], 
    columns: any[], 
    reportName: string, 
    format: 'pdf' | 'csv' | 'xlsx'
  ) {
    const filename = `${reportName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'pdf') {
      await this.exportToPDF('report-content', filename, reportName);
    } else if (format === 'csv') {
      this.exportToCSV(data, columns, filename);
    } else {
      this.exportToExcel(data, columns, filename);
    }
  }
}