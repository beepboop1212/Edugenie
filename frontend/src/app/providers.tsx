// src/app/providers.tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ConfigProvider, theme } from 'antd';

const customTheme = {
    token: {
      // A calming, educational primary color
      colorPrimary: '#007A7C',
      // Softer corners for a modern feel
      borderRadius: 8,
      // Use the Poppins font we imported
      fontFamily: 'Poppins, sans-serif',
      // Subtle background color for the page
      colorBgLayout: '#f5f7fa',
    },
    algorithm: theme.defaultAlgorithm, // Use the default antd algorithm
  };
  
  export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = React.useState(() => new QueryClient());
    return (
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={customTheme}>
          {children}
        </ConfigProvider>
      </QueryClientProvider>
    );
  }