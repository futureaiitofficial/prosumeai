declare module 'pdfmake/build/pdfmake' {
  export interface TDocumentDefinitions {
    content: any[];
    styles?: any;
    defaultStyle?: any;
    pageSize?: string;
    pageMargins?: number[];
    pageOrientation?: string;
    footer?: (currentPage: number, pageCount: number) => any;
    header?: (currentPage: number, pageCount: number) => any;
    [key: string]: any;
  }

  export interface PdfMakeStatic {
    createPdf(documentDefinition: TDocumentDefinitions): PdfPrinter;
    vfs: any;
  }

  export interface PdfPrinter {
    download(filename: string): void;
    getBase64(callback: (data: string) => void): void;
    getBuffer(callback: (buffer: Buffer) => void): void;
    getBlob(callback: (blob: Blob) => void): void;
    getDataUrl(callback: (dataUrl: string) => void): void;
  }

  const pdfMake: PdfMakeStatic;
  export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
  const pdfFonts: {
    pdfMake: {
      vfs: Record<string, string>;
    };
  };
  export default pdfFonts;
} 