import { createApp } from './presentation/app';

const main = () => {
  const app = createApp();

  const PORT = process.env.PORT ?? 3000;

  app.listen(PORT, () => {
    console.warn(`Server is running on port ${PORT}`);
  });
};

main();
