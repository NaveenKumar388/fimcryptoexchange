import express from 'express';
import { webhookCallback } from 'grammy';
import bot from './bot';
import { config } from './config';
import { testDatabaseConnections } from './database';

async function startServer() {
  console.log('Starting server...');
  console.log('Environment:', config.NODE_ENV);
  console.log('Port:', config.PORT);

  try {
    // Test database connections
    const connected = await testDatabaseConnections();
    if (!connected) {
      throw new Error('Failed to connect to databases');
    }

    const app = express();
    app.use(express.json());

    // Webhook handler
    app.use('/webhook', webhookCallback(bot, 'express'));

    // Health check endpoint
    app.get('/health', async (_: express.Request, res: express.Response) => {
      const dbConnected = await testDatabaseConnections();
      res.status(dbConnected ? 200 : 500).json({ 
        status: dbConnected ? 'ok' : 'error',
        timestamp: new Date().toISOString()
      });
    });

    const port = parseInt(config.PORT, 10);
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server is running on port ${port}`);
      console.log('Express server setup complete');
    });

    // Start the bot
    await bot.api.setWebhook(`https://${process.env.RENDER_EXTERNAL_HOSTNAME}/webhook`);
    console.log('Webhook set:', `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/webhook`);
    console.log('Bot username:', (await bot.api.getMe()).username);

  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);

