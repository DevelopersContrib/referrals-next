import { describe, it, expect } from "vitest";
import { bodyTextToPlain, cleanBodyHtml } from "./body-text";

describe("bodyTextToPlain", () => {
  it("treats an empty paragraph as empty", () => {
    expect(bodyTextToPlain("<p></p>")).toBeNull();
  });

  it("treats blank paragraphs and line breaks as empty", () => {
    expect(bodyTextToPlain("<p>&nbsp;</p><p><br></p>")).toBeNull();
  });

  it("rejects [object Object] and non-strings", () => {
    expect(bodyTextToPlain("[object Object]")).toBeNull();
    expect(bodyTextToPlain({ rich: "text" })).toBeNull();
    expect(bodyTextToPlain(undefined)).toBeNull();
  });

  it("strips tags from real text", () => {
    expect(bodyTextToPlain("<p>Join <strong>today</strong></p>")).toBe("Join today");
  });

  it("keeps separate paragraphs apart", () => {
    expect(bodyTextToPlain("<p>One</p><p>Two</p>")).toBe("One Two");
  });

  it("decodes common entities", () => {
    expect(bodyTextToPlain("<p>Tom &amp; Jerry&nbsp;win</p>")).toBe("Tom & Jerry win");
  });
});

describe("cleanBodyHtml", () => {
  it("drops an empty paragraph", () => {
    expect(cleanBodyHtml("<p></p>")).toBeNull();
  });

  it("drops [object Object] and blank strings", () => {
    expect(cleanBodyHtml("[object Object]")).toBeNull();
    expect(cleanBodyHtml("   ")).toBeNull();
  });

  it("keeps real HTML as written", () => {
    expect(cleanBodyHtml(" <p>Hello</p> ")).toBe("<p>Hello</p>");
  });

  it("keeps image-only content", () => {
    expect(cleanBodyHtml('<p><img src="https://example.com/a.png"></p>')).toBe(
      '<p><img src="https://example.com/a.png"></p>'
    );
  });
});
