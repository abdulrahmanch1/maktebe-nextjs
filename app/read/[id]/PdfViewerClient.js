'use client';

import React from 'react';

const PdfViewerClient = ({ pdfUrl, bookTitle }) => {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <iframe
        src={pdfUrl}
        title={bookTitle}
        width="98.45%-10PX"
        height="100%"
        style={{ border: 'none' }}
      >
      </iframe>
    </div>
  );
};

export default PdfViewerClient;