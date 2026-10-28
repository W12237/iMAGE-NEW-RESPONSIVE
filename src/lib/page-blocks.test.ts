import {describe,expect,it} from "vitest";
import {BLOCK_PAGES,BUILTIN_BLOCKS,CONTACT_FORM_BLOCK,CUSTOM_BLOCK,isValidBlockKind,missingBuiltinBlocks} from "./page-blocks";
import {parsePageBlocksInput} from "./page-blocks-input";

const custom=(page:string,overrides:Record<string,unknown>={})=>({id:`custom-${page}-${Math.random().toString(36).slice(2,10)}`,page,kind:CUSTOM_BLOCK,layout:"TEXT",titleEn:"Hello",titleAr:"مرحبا",visible:true,...overrides});
const block=(page:string,kind:string,visible=true)=>({id:`builtin_${page}_${kind.toLowerCase()}`,page,kind,visible});

describe("page-builder registry",()=>{
  it("covers every public page with unique built-in keys",()=>{
    expect(BLOCK_PAGES).toEqual(["home","about","history","developments","journal","team","partners","policy","terms","contact"]);
    for(const page of BLOCK_PAGES){const keys=BUILTIN_BLOCKS[page].map(b=>b.key);expect(new Set(keys).size).toBe(keys.length)}
  });
  it("offers the contact form everywhere except the contact page",()=>{
    for(const page of BLOCK_PAGES)expect(isValidBlockKind(page,CONTACT_FORM_BLOCK)).toBe(page!=="contact");
  });
  it("rejects built-ins from another page",()=>{
    expect(isValidBlockKind("about","HOME_HERO")).toBe(false);
    expect(isValidBlockKind("home","HOME_HERO")).toBe(true);
    expect(isValidBlockKind("home",CUSTOM_BLOCK)).toBe(true);
  });
  it("lists only removed built-ins as addable",()=>{
    expect(missingBuiltinBlocks("team",["TEAM_HERO"]).map(b=>b.key)).toEqual(["TEAM_ROSTER",CONTACT_FORM_BLOCK]);
  });
});

describe("parsePageBlocksInput",()=>{
  it("keeps array order as the per-page sort order",()=>{
    const result=parsePageBlocksInput([custom("home",{titleEn:"First"}),block("home","HOME_HERO"),block("about","ABOUT_HERO"),block("home","HOME_STATS",false)]);
    if("error" in result)throw new Error(result.error);
    expect(result.rows.filter(r=>r.page==="home").map(r=>[r.kind,r.sortOrder,r.visible])).toEqual([[CUSTOM_BLOCK,0,true],["HOME_HERO",1,true],["HOME_STATS",2,false]]);
    expect(result.rows.find(r=>r.page==="about")?.sortOrder).toBe(0);
  });
  it("strips content from built-ins and does not require headings",()=>{
    const result=parsePageBlocksInput([{...block("home","HOME_HERO"),titleEn:"x",bodyEn:"y",imageUrl:"/a.jpg"}]);
    if("error" in result)throw new Error(result.error);
    expect(result.rows[0]).toMatchObject({kind:"HOME_HERO",titleEn:"",bodyEn:"",imageUrl:null,layout:"TEXT"});
  });
  it("allows a built-in only once per page",()=>{
    expect(parsePageBlocksInput([block("home","HOME_HERO"),{...block("home","HOME_HERO"),id:"another-hero-id"}])).toHaveProperty("error");
  });
  it("requires bilingual headings and a valid layout on custom sections",()=>{
    expect(parsePageBlocksInput([custom("home",{titleAr:""})])).toHaveProperty("error");
    expect(parsePageBlocksInput([custom("home",{layout:"NOPE"})])).toHaveProperty("error");
  });
  it("rejects unknown pages and kinds",()=>{
    expect(parsePageBlocksInput([custom("blog")])).toHaveProperty("error");
    expect(parsePageBlocksInput([block("home","ABOUT_HERO")])).toHaveProperty("error");
  });
  it("treats rows without a kind as custom sections (older clients)",()=>{
    const {kind:_omit,...legacy}=custom("terms");void _omit;
    const result=parsePageBlocksInput([legacy]);
    if("error" in result)throw new Error(result.error);
    expect(result.rows[0].kind).toBe(CUSTOM_BLOCK);
  });
});
