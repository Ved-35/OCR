import React from 'react';

export const FeatureGrid: React.FC = () => {
  const features = [
    {
      icon: '🚀',
      title: 'Vite React Setup',
      desc: 'Lightning-fast HMR, TypeScript support, modular components, and build system.'
    },
    {
      icon: '⚙️',
      title: 'Node.js Express Backend',
      desc: 'Clean RESTful architecture with controllers, middleware, CORS, and environment configs.'
    },
    {
      icon: '🎨',
      title: 'Modern CSS Design System',
      desc: 'Pure vanilla CSS with HSL variables, glassmorphism, responsive grid, and dark mode aesthetics.'
    },
    {
      icon: '🛡️',
      title: 'TypeScript Ready',
      desc: 'End-to-end type safety between backend responses and frontend state management.'
    }
  ];

  return (
    <div className="cards-grid">
      {features.map((feature, idx) => (
        <div key={idx} className="card glass-panel">
          <div className="card-icon">{feature.icon}</div>
          <h4 className="card-title">{feature.title}</h4>
          <p className="card-desc">{feature.desc}</p>
        </div>
      ))}
    </div>
  );
};
