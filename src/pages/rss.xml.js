import rss from "@astrojs/rss";
import { getSinglePage } from "@/lib/contentParser.astro";

export async function GET(context) {
  const blogs = await getSinglePage("blogs");
  return rss({
    title: "Valentin Kolb",
    description: "Blogs über Informatik, Kulinarik und mehr",
    site: context.site,
    items: blogs.map((blog) => ({
      title: blog.data.title,
      pubDate: blog.data.pubDate,
      description: blog.data.description,
      link: `/blog/${blog.slug}/`,
    })),
  });
}
