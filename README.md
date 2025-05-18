# Personal Portfolio & Blog

A modern personal website built with Astro.js featuring a photo gallery, blog with recipe support, and project showcase. Designed for speed, simplicity, and ease of use.

![Docker Image Version](https://img.shields.io/docker/v/valentinkolb/homepage?sort=semver&label=docker)
![License](https://img.shields.io/github/license/valentinkolb/homepage)

## Link

https://valentin-kolb.blog

## Technologies

- **Framework**: [Astro](https://astro.build/)
- **UI Components**: [SolidJS](https://www.solidjs.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Runtime**: [Bun](https://bun.sh/)
- **Deployment**: Docker with GitHub Actions

## Project Structure

```
.
├── public/             # Static assets
│   ├── images/         # Image galleries and blog images
│   └── scripts/        # Client-side helper scripts (theme, ...)
├── src/
│   ├── components/     # UI components
│   ├── content/        # Content collections (blogs, gallery, projects)
│   ├── features/       # Feature modules (editor, chat)
│   ├── lib/            # Utility functions
│   ├── pages/          # Astro page routes
│   └── styles/         # Global styles
├── Dockerfile           # Container definition
└── scripts/             # Utility scripts (image processing)
```

## Features

- Responsive photo galleries with lightbox
- Markdown/MDX blog with recipe support
- Projects showcase
- Dark/light mode
- Docker deployment

## Docker

The site is available as a Docker image:

```bash
docker pull valentinkolb/homepage:latest
docker run -p 4321:4321 valentinkolb/homepage:latest
```

## Development

```bash
# Clone the repository
git clone https://github.com/your-username/homepage.git
cd homepage

# Install dependencies
bun install

# Start development server
bun run dev
```

## CI/CD Pipeline

The project uses GitHub Actions to automatically build and push Docker images to Docker Hub when commits are pushed to the main branch. See `.github/workflows/docker-build.yml` for details.

## Licensing

This project uses multiple licenses for different components:

- **Code**: All source code is available under the [MIT License](LICENSE.md).
- **Images**: All images in the `public/images` directory are licensed under the [Creative Commons Attribution-NonCommercial 4.0 (CC BY-NC 4.0) License](public/images/LICENSE-IMAGES.md) and may not be used for commercial purposes.
- **Blog Content**: All blog posts and related content in the `src/content/blogs` directory are licensed under the [Creative Commons Attribution-NonCommercial 4.0 (CC BY-NC 4.0) License](src/content/blogs/LICENSE-BLOG-CONTENT.md) and may not be used for commercial purposes.

If you wish to use any content covered by the CC BY-NC licenses for commercial purposes, please contact the author for permission.