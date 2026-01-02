
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
      <main className="max-w-5xl mx-auto w-full px-6 py-12 md:py-20">
        {children}
      </main>
    </div>
  );
};
