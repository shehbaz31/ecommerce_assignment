import express, { Express } from 'express';
import { config } from './config/config';
import { errorMiddleware } from './api/middlewares/error.middleware';
import orderRoutes from './api/routes/order.routes';

export const app: Express = express();
app.use(express.json());
app.use(orderRoutes);
app.use(errorMiddleware);

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Ease Commerce API listening on port ${config.port}`);
  });
}
