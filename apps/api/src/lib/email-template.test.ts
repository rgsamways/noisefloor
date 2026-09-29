import { describe, expect, it } from "vitest";
import { escapeHtml, renderEmail } from "./email-template.js";

const content = {
  heading: "Sign in to noisefloor",
  paragraphs: ["Use the button below."],
  button: { label: "Sign in", url: "https://api.example.com/verify?token=abc&callbackURL=https%3A%2F%2Fexample.com" },
  footer: "This link expires in 30 minutes.",
};

describe("renderEmail", () => {
  it("includes the heading, copy, button link, and footer in html and text", () => {
    const { html, text } = renderEmail(content);
    expect(html).toContain("Sign in to noisefloor");
    expect(html).toContain("Use the button below.");
    expect(html).toContain("This link expires in 30 minutes.");
    expect(text).toContain("Sign in: https://api.example.com/verify?token=abc&callbackURL=https%3A%2F%2Fexample.com");
    expect(text).toContain("This link expires in 30 minutes.");
  });

  it("escapes the url in html attributes but leaves the plain-text url raw", () => {
    const { html, text } = renderEmail(content);
    expect(html).toContain('href="https://api.example.com/verify?token=abc&amp;callbackURL=');
    expect(html).not.toContain("token=abc&callbackURL");
    expect(text).toContain("token=abc&callbackURL");
  });

  it("escapes caller-supplied copy so a group name can't inject html", () => {
    const { html } = renderEmail({ ...content, paragraphs: ['Added to <script>alert("x")</script>'] });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("escapeHtml", () => {
  it("escapes the five html-significant characters", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });
});
