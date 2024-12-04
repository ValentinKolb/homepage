# Stage 1: Build
FROM ubuntu:20.04 AS build

# Set noninteractive mode for apt
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl git tar && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set the Hugo version
ARG HUGO_VERSION=0.139.0

# Download and install the specific version of Hugo
RUN curl -L https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_Linux-64bit.tar.gz \
    | tar -xz -C /usr/local/bin hugo

# Verify Hugo installation
RUN hugo version

# Set workdir to the Hugo app directory
WORKDIR /opt/HugoApp

# Copy Hugo config and site files into the container Workdir
COPY . .

# Install PaperMod theme
RUN git clone https://github.com/adityatelange/hugo-PaperMod themes/PaperMod --depth=1

# Run Hugo to generate the HTML files
RUN hugo --minify

# Stage 2: Serve with NGINX
FROM nginx:1.25-alpine

# Set workdir to the NGINX default directory
WORKDIR /usr/share/nginx/html

# Copy the generated HTML files from the build stage
COPY --from=build /opt/HugoApp/public .

# Expose port 80
EXPOSE 80/tcp