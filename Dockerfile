# Stage 1: Build
FROM alpine:latest AS build

# Install dependencies
RUN apk add --no-cache curl tar git

# Set the Hugo version
ARG HUGO_VERSION=0.139.0

# Download and install the specific version of Hugo
RUN curl -L https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_Linux-64bit.tar.gz \
    | tar -xz -C /usr/bin hugo

# Ensure Hugo is executable
RUN chmod +x /usr/bin/hugo

# Verify Hugo installation
RUN /usr/bin/hugo version

# Set workdir to the Hugo app dir
WORKDIR /opt/HugoApp

# Copy Hugo config and site content into the container Workdir
COPY . .

# Install PaperMod theme
RUN git clone https://github.com/adityatelange/hugo-PaperMod themes/PaperMod --depth=1

# Run Hugo in the Workdir to generate HTML
RUN /usr/local/bin/hugo

# Stage 2: Serve with NGINX
FROM nginx:1.25-alpine

# Set workdir to the NGINX default dir
WORKDIR /usr/share/nginx/html

# Copy the generated HTML files from the build stage
COPY --from=build /opt/HugoApp/public .

# Expose port 80
EXPOSE 80/tcp