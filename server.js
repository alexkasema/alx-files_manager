import express from 'express';
import routing from './routes/index';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

routing(app);

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});

export default app;
