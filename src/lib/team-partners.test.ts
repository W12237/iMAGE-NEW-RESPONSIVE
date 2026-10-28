import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getTeamPageContent, getPartnersPageContent, getHomepageContent, getTermsPageContent } from "./content";

describe("Team and Partners bilingual page content", () => {
  const latinWords = ["lorem", "ipsum", "nesciunt", "occaecat", "adipisici", "dfgfd", "dfgdf"];

  it("loads Team page in English with valid content and no weird text", async () => {
    const data = await getTeamPageContent("en");
    expect(data.locale).toBe("en");
    expect(data.teamPage.eyebrow).toBe("The people behind Image");
    expect(data.teamPage.title).toBe("Different perspectives. One shared vision.");
    expect(data.teamPage.intro.length).toBeGreaterThan(20);
    expect(data.teamPage.members.length).toBeGreaterThan(0);

    for (const member of data.teamPage.members) {
      expect(member.name).toBeTruthy();
      expect(member.role).toBeTruthy();
      expect(member.bio).toBeTruthy();
      for (const bad of latinWords) {
        expect(member.name.toLowerCase()).not.toContain(bad);
        expect(member.role.toLowerCase()).not.toContain(bad);
        expect(member.bio.toLowerCase()).not.toContain(bad);
      }
    }
  });

  it("loads Team page in Arabic with valid Arabic content and no weird text", async () => {
    const data = await getTeamPageContent("ar");
    expect(data.locale).toBe("ar");
    expect(data.teamPage.eyebrow).toBe("فريق إيمدج");
    expect(data.teamPage.title).toBe("منظورات متعددة. رؤية واحدة مشتركة.");
    expect(data.teamPage.intro.length).toBeGreaterThan(20);
    expect(data.teamPage.members.length).toBeGreaterThan(0);

    for (const member of data.teamPage.members) {
      expect(member.name).toBeTruthy();
      expect(member.role).toBeTruthy();
      expect(member.bio).toBeTruthy();
      for (const bad of latinWords) {
        expect(member.name.toLowerCase()).not.toContain(bad);
        expect(member.role.toLowerCase()).not.toContain(bad);
        expect(member.bio.toLowerCase()).not.toContain(bad);
      }
    }
  });

  it("loads Partners page in English with valid content and no weird text", async () => {
    const data = await getPartnersPageContent("en");
    expect(data.locale).toBe("en");
    expect(data.partnersPage.eyebrow).toBe("Our partners");
    expect(data.partnersPage.title).toBe("Built together. Made to last.");
    expect(data.partnersPage.intro.length).toBeGreaterThan(20);
    expect(data.partnersPage.partners.length).toBeGreaterThan(0);

    for (const partner of data.partnersPage.partners) {
      expect(partner.name).toBeTruthy();
      for (const bad of latinWords) {
        expect(partner.name.toLowerCase()).not.toContain(bad);
        if (partner.description) {
          expect(partner.description.toLowerCase()).not.toContain(bad);
        }
      }
    }
  });

  it("loads Partners page in Arabic with valid Arabic content and no weird text", async () => {
    const data = await getPartnersPageContent("ar");
    expect(data.locale).toBe("ar");
    expect(data.partnersPage.eyebrow).toBe("شركاؤنا");
    expect(data.partnersPage.title).toBe("نبني معاً. لنصنع أثراً يدوم.");
    expect(data.partnersPage.intro.length).toBeGreaterThan(20);
    expect(data.partnersPage.partners.length).toBeGreaterThan(0);

    for (const partner of data.partnersPage.partners) {
      expect(partner.name).toBeTruthy();
      for (const bad of latinWords) {
        expect(partner.name.toLowerCase()).not.toContain(bad);
        if (partner.description) {
          expect(partner.description.toLowerCase()).not.toContain(bad);
        }
      }
    }
  });

  it("loads Homepage and verifies featured stories are all authentic", async () => {
    const data = await getHomepageContent("en");
    expect(data.journal.stories.length).toBe(3);
    for (const story of data.journal.stories) {
      for (const bad of latinWords) {
        expect(story.title.toLowerCase()).not.toContain(bad);
      }
    }
  });

  it("loads Terms page with valid sections", async () => {
    const en = await getTermsPageContent("en");
    expect(en.termsPage.sections.length).toBeGreaterThan(0);
    const ar = await getTermsPageContent("ar");
    expect(ar.termsPage.sections.length).toBeGreaterThan(0);
  });
});
