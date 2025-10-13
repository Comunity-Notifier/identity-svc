import { createApp } from './presentation/app';

const main = async () => {
  const app = await createApp();

  const PORT = process.env.PORT ?? 3000;

  app.listen(PORT, () => {
    console.warn(`Server is running on port ${PORT}`);
  });
};

main().catch((err) => console.log(err));
