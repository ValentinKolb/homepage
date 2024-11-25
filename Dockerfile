# Stage 1: Build the Hugo site
FROM klakegg/hugo:ext-alpine as builder

# Set the working directory
WORKDIR /app

# Copy the Hugo project files
COPY . .

# Build the Hugo website
RUN hugo --minify

# Stage 2: Serve the site
FROM nginx:alpine

# Copy the built site to nginx
COPY --from=builder /app/public /usr/share/nginx/html

# Expose the default nginx port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]