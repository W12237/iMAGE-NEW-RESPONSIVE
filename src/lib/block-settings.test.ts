import {describe,expect,it} from "vitest";
import {blockLabel,blockStyleAttributes,parseBlockSettings} from "./block-settings";
import {parsePageBlocksInput} from "./page-blocks-input";

describe("block settings",()=>{
  it("keeps valid sizes and labels and drops the rest",()=>{
    expect(parseBlockSettings({headingSize:"72",headingSizeMobile:5,bodySize:18.5,labelSize:"",labelEn:"  Our places ",labelAr:"",evil:"x"})).toEqual({headingSize:72,labelEn:"Our places"});
  });
  it("accepts JSON strings and survives bad JSON",()=>{
    expect(parseBlockSettings('{"bodySize":16}')).toEqual({bodySize:16});
    expect(parseBlockSettings("{oops")).toEqual({});
    expect(parseBlockSettings("[1]")).toEqual({});
  });
  it("turns sizes into CSS variables only when set",()=>{
    expect(blockStyleAttributes({}).active).toBe(false);
    const attrs=blockStyleAttributes({headingSize:64,headingSizeMobile:40});
    expect(attrs.style).toEqual({"--pb-heading":"64px","--pb-heading-mobile":"40px"});
    expect(Object.keys(attrs.data)).toEqual(["data-heading","data-heading-mobile"]);
  });
  it("picks the label for the locale",()=>{
    expect(blockLabel({labelEn:"Places",labelAr:"أماكن"},"ar")).toBe("أماكن");
    expect(blockLabel({labelAr:"أماكن"},"en")).toBeUndefined();
  });
  it("saves settings with the section and strips labels where unsupported",()=>{
    const result=parsePageBlocksInput([{id:"builtin_home_home_projects",page:"home",kind:"HOME_PROJECTS",visible:true,settings:{headingSize:90,labelEn:"Our places"}},{id:"builtin_home_home_hero",page:"home",kind:"HOME_HERO",visible:true,settings:{labelEn:"nope",bodySize:20}}]);
    if("error" in result)throw new Error(result.error);
    expect(JSON.parse(result.rows[0].settings)).toEqual({headingSize:90,labelEn:"Our places"});
    expect(JSON.parse(result.rows[1].settings)).toEqual({bodySize:20});
  });
});
