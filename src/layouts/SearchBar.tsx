import React, { useEffect, useRef, useState } from "react";
import Fuse from "fuse.js";
import config from "@/config/config.json";
import dateFormat from "@/lib/utils/dateFormat";
import { humanize, plainify, slugify } from "@/lib/utils/textConverter";
import {
  IconCalendarMonth,
  IconCategory,
  IconSearch,
} from "@tabler/icons-react";

const { summary_length } = config.settings;

export type SearchItem = {
  slug: string;
  data: any;
  content: any;
};

interface Props {
  searchList: SearchItem[];
}

interface SearchResult {
  item: SearchItem;
  refIndex: number;
}

export default function SearchBar({ searchList }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputVal, setInputVal] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(
    null,
  );

  const handleChange = (e: React.FormEvent<HTMLInputElement>) => {
    setInputVal(e.currentTarget.value);
  };

  const fuse = new Fuse(searchList, {
    keys: ["data.title", "data.categories", "data.tags"],
    includeMatches: true,
    minMatchCharLength: 2,
    threshold: 0.5,
  });

  useEffect(() => {
    const searchUrl = new URLSearchParams(window.location.search);
    const searchStr = searchUrl.get("q");
    if (searchStr) setInputVal(searchStr);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = inputRef.current.selectionEnd =
          searchStr?.length || 0;
      }
    }, 50);
  }, []);

  useEffect(() => {
    let inputResult = inputVal.length > 2 ? fuse.search(inputVal) : [];
    setSearchResults(inputResult);

    if (inputVal.length > 0) {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set("q", inputVal);
      const newRelativePathQuery =
        window.location.pathname + "?" + searchParams.toString();
      history.pushState(null, "", newRelativePathQuery);
    } else {
      history.pushState(null, "", window.location.pathname);
    }
  }, [inputVal]);

  return (
    <div className="">
      {/* Search Input */}
      <div className="mx-auto">
        <div className="relative flex items-center w-full h-12 rounded-lg focus-within:shadow-lg bg-gray-100 overflow-hidden">
          {/* Icon */}
          <div className="grid place-items-center h-full w-12 text-gray-500 peer-focus:text-primary">
            <IconSearch className="h-5 w-5" />
          </div>

          {/* Input Field */}
          <input
            className="peer h-full w-full border-none bg-gray-100 pl-3 pr-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-0 transition"
            type="text"
            id="search"
            placeholder="Suche nach Inhalten, Kategorien oder Tags..."
            value={inputVal}
            onChange={handleChange}
            autoComplete="off"
            ref={inputRef}
          />
        </div>
      </div>

      {/* Search Results Info */}
      {inputVal.length > 1 && (
        <div className="my-6 text-xs text-center text-gray-400">
          <span className="font-medium">
            {searchResults?.length || 0}{" "}
            {searchResults?.length === 1 ? "Ergebnis" : "Ergebnisse"}
          </span>{" "}
          für "{inputVal}" gefunden.
        </div>
      )}

      {/* Results List */}
      <ul className="divide-y divide-gray-200">
        {searchResults?.map(({ item }) => (
          <li
            key={item.slug}
            className="py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center"
          >
            <div className="flex-grow">
              <h3 className="text-lg font-bold hover:text-primary transition-colors duration-300">
                <a href={`/blog/${item.slug}`}>{item.data.title}</a>
              </h3>
              <p className="text-sm text-gray-600">
                {item.data.description ??
                  plainify(
                    `${item.content?.slice(0, Number(summary_length))} ...`,
                  )}
              </p>
              <ul className="flex items-center space-x-4 text-gray-500 text-sm mt-2">
                <li className="flex items-center">
                  <IconCalendarMonth className="mr-1 h-4 w-4" />
                  {dateFormat(item.data.date)}
                </li>
                {item.data.categories.length > 0 && (
                  <li className="flex items-center">
                    <IconCategory className="mr-1 h-4 w-4" />
                    {item.data.categories.map((category: string, i: number) => (
                      <a
                        key={i}
                        href={`/blogs/c/${slugify(category)}`}
                        className="hover:text-primary transition"
                      >
                        {humanize(category)}
                        {i !== item.data.categories.length - 1 && ", "}
                      </a>
                    ))}
                  </li>
                )}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
