# Stage 1
FROM alpine:latest AS build

# Install the Hugo go app and git
RUN apk add --no-cache curl tar git

# Set the Hugo version
ARG HUGO_VERSION=0.139.0

# Download and install the specific version of Hugo
RUN curl -L https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_Linux-64bit.tar.gz \
    | tar -xz -C /usr/local/bin hugo

# Set workdir to the Hugo app dir.
WORKDIR /opt/HugoApp

# Copy Hugo config into the container Workdir.
COPY . .

# install PaperMod Theme
RUN git clone https://github.com/adityatelange/hugo-PaperMod themes/PaperMod --depth=1

# Run Hugo in the Workdir to generate HTML.
RUN hugo

# Stage 2
FROM nginx:1.25-alpine

# Set workdir to the NGINX default dir.
WORKDIR /usr/share/nginx/html

# Copy HTML from previous build into the Workdir.
COPY --from=build /opt/HugoApp/public .

# Expose port 80
EXPOSE 80/tcp