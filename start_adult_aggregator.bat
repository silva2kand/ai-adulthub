@echo off
echo 🚀 Starting Adult Video Aggregator Platform...
echo ==============================================

cd "C:\Users\Siva\Documents\adult-video-aggregator"

echo 📦 Installing dependencies...
call npm install

echo ⚡ Starting the server...
npm start

echo.
echo 🎉 Adult Video Aggregator is running!
echo 🌐 Access your platform at: http://localhost:4000
echo 📚 API Documentation: http://localhost:4000/api-docs
echo 🏥 Health Check: http://localhost:4000/health
echo.
pause
