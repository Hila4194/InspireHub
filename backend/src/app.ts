import initApp from './server';

const startServer = async () => {
  try {
    const app = await initApp();
    const PORT = process.env.PORT || 4040;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
  }
};

startServer();