#!/bin/bash

# Configuration
SERVER_USER="your_username"  # Replace with your actual SSH username
SERVER_IP="your_server_ip"   # Replace with your actual server IP
SERVER_PATH="/path/on/server/fashcognitive"  # Where to deploy on the server
ENV_FILE=".env.production"
DOMAIN_NAME="your_domain_name"  # Your domain or server IP

# Build the frontend
echo "Building frontend..."
cd frontend
yarn build
cd ..

# Create .env file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
  echo "Creating $ENV_FILE..."
  cat > "$ENV_FILE" << EOF
DB_USER=log
DB_PASSWORD=secure_password_here
DOMAIN_NAME=your_domain_or_ip
EOF
  echo "Please edit $ENV_FILE with your production values"
  exit 1
fi

# Create deployment directory on server
echo "Creating deployment directory on server..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_PATH"

# Copy files to server
echo "Copying files to server..."
rsync -avz --exclude 'node_modules' --exclude '.git' \
  --exclude 'frontend/node_modules' --exclude 'frontend/.git' \
  ./ $SERVER_USER@$SERVER_IP:$SERVER_PATH/

# Copy .env file
echo "Copying .env file..."
scp $ENV_FILE $SERVER_USER@$SERVER_IP:$SERVER_PATH/.env

# SSH into server and start containers
echo "Starting containers on server..."
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && \
  docker-compose -f docker-compose.prod.yml --env-file .env down && \
  docker-compose -f docker-compose.prod.yml --env-file .env up -d"

echo "Deployment completed!"
