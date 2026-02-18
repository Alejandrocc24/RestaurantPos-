declare module 'jspdf' {
  interface jsPDFOptions {
    orientation?: 'portrait' | 'landscape';
    unit?: string;
    format?: string | [number, number];
    compress?: boolean;
    precision?: number;
    userUnit?: number;
    encryption?: any;
    putOnlyUsedFonts?: boolean;
    floatPrecision?: number;
  }

  class jsPDF {
    constructor(options?: jsPDFOptions);
    text(text: string, x: number, y: number, options?: any): jsPDF;
    setFontSize(size: number): jsPDF;
    setFont(font: string, style?: string): jsPDF;
    setLineWidth(width: number): jsPDF;
    line(x1: number, y1: number, x2: number, y2: number): jsPDF;
    save(filename?: string): void;
    output(type?: string): string | Uint8Array;
  }

  export = jsPDF;
  export { jsPDF };
}

declare module 'jspdf-autotable' {
  interface autoTableOptions {
    startY?: number;
    head?: any[][];
    body?: any[][];
    theme?: string;
    styles?: any;
    columnStyles?: any;
    margin?: any;
  }

  function autoTable(doc: any, options: autoTableOptions): void;
  export = autoTable;
}
