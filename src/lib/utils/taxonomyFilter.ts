import { slugify } from "@/lib/utils/textConverter";

const taxonomyFilter = (blogs: any[], name: string, key: any) => {
  return blogs.filter((blog) =>
    blog.data[name]?.map((name: string) => slugify(name)).includes(key),
  );
};

export default taxonomyFilter;
