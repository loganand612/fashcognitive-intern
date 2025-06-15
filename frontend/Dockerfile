FROM node:16-alpine

WORKDIR /app

# Set npm to use a different registry if the default one is blocked
RUN npm config set registry https://registry.npmjs.org/

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install --no-package-lock --force

# Copy the rest of the application
COPY . .

# Build the app
RUN npm run build

# Production environment
FROM nginx:stable-alpine
COPY --from=0 /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]



