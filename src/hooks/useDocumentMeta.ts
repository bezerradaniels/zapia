import { useEffect } from "react";

type DocumentMeta = {
  title: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  noindex?: boolean;
};

function setMetaTag(attrName: "name" | "property", attrValue: string, content: string) {
  let tag = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setCanonical(href: string) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

export function useDocumentMeta({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  noindex,
}: DocumentMeta) {
  useEffect(() => {
    const previousTitle = document.title;
    const previousDesc = document.querySelector('meta[name="description"]')?.getAttribute("content");
    const previousCanonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href");

    document.title = title;

    if (description) {
      setMetaTag("name", "description", description);
      setMetaTag("property", "og:description", ogDescription || description);
      setMetaTag("name", "twitter:description", ogDescription || description);
    }

    setMetaTag("property", "og:title", ogTitle || title);
    setMetaTag("name", "twitter:title", ogTitle || title);

    const canonicalUrl =
      canonical ||
      (typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}`
        : "https://zapia.app/");

    setCanonical(canonicalUrl);
    setMetaTag("property", "og:url", canonicalUrl);

    if (noindex) {
      setMetaTag("name", "robots", "noindex, nofollow");
    } else {
      setMetaTag("name", "robots", "index, follow");
    }

    return () => {
      document.title = previousTitle;
      if (previousDesc) {
        setMetaTag("name", "description", previousDesc);
      }
      if (previousCanonical) {
        setCanonical(previousCanonical);
      }
    };
  }, [title, description, canonical, ogTitle, ogDescription, noindex]);
}
