import express from 'express';

const app = express();

app.listen(3000, () => {
  console.warn(`Servidor escuchando en el puerto ${3001}`);
});
