import { Request, Response } from 'express';

export const getSampleItems = (_req: Request, res: Response): void => {
  const items = [
    {
      id: '1',
      title: 'Frontend React (Vite)',
      description: 'Vite powered React 18 application with TypeScript',
      category: 'Frontend',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Backend Node.js (Express)',
      description: 'Express.js application written with TypeScript',
      category: 'Backend',
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Design System',
      description: 'Vanilla CSS tokens, glassmorphism, responsive grid',
      category: 'UI/UX',
      createdAt: new Date().toISOString(),
    },
  ];

  res.status(200).json(items);
};
