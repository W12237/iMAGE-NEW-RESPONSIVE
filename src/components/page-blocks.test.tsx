import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe,expect,it,vi} from "vitest";
import type {PageSectionContent} from "../content/home";

vi.mock("next/image",()=>({default:({fill,...props}:React.ImgHTMLAttributes<HTMLImageElement>&{fill?:boolean})=>{void fill;return <span data-image-alt={String(props.alt??"")}/>}}));
vi.mock("./motion-reveal",()=>({Reveal:({children,className}:{children:React.ReactNode;className?:string})=><div className={className}>{children}</div>}));

import {PageBlocks,pageBlocksFor,planPageBlocks} from "./page-blocks";

const custom=(id:string,title:string):PageSectionContent=>({id,kind:"CUSTOM",layout:"TEXT",eyebrow:"",title,body:"",imageAlt:"",backgroundRgb:"255, 255, 255"});
const builtin=(id:string,kind:string):PageSectionContent=>({id,kind,layout:"TEXT",eyebrow:"",title:"",body:"",imageAlt:"",backgroundRgb:"255, 255, 255"});
const builtins={HERO:<header>HERO</header>,STATS:<section>STATS</section>,FORM:<aside>FORM</aside>};
const order=(html:string,tokens:string[])=>tokens.map(token=>html.indexOf(token));

describe("PageBlocks",()=>{
  it("renders built-ins and custom sections in the saved order",()=>{
    const html=renderToStaticMarkup(<PageBlocks blocks={[builtin("b1","HERO"),custom("c1","Between"),builtin("b2","STATS"),custom("c2","After"),builtin("b3","FORM")]} builtins={builtins}/>);
    const positions=order(html,["HERO","Between","STATS","After","FORM"]);
    expect(positions.every(p=>p>=0)).toBe(true);
    expect([...positions].sort((a,b)=>a-b)).toEqual(positions);
  });
  it("omits built-ins that are not saved on the page",()=>{
    const html=renderToStaticMarkup(<PageBlocks blocks={[builtin("b2","STATS")]} builtins={builtins}/>);
    expect(html).toContain("STATS");expect(html).not.toContain("HERO");expect(html).not.toContain("FORM");
  });
  it("renders the default built-ins when there is no database",()=>{
    const html=renderToStaticMarkup(<PageBlocks blocks={undefined} builtins={builtins}/>);
    expect(order(html,["HERO","STATS","FORM"])).toEqual([...order(html,["HERO","STATS","FORM"])].sort((a,b)=>a-b));
  });
  it("groups consecutive custom sections and numbers them across the page",()=>{
    const runs=planPageBlocks([custom("c1","A"),custom("c2","B"),builtin("b1","HERO"),custom("c3","C")]);
    expect(runs.map(r=>r.type)).toEqual(["custom","builtin","custom"]);
    const html=renderToStaticMarkup(<PageBlocks blocks={[custom("c1","A"),builtin("b1","HERO"),custom("c3","C")]} builtins={builtins}/>);
    expect(html).toContain("<span>01</span>");expect(html).toContain("<span>02</span>");
  });
  it("treats an empty saved page as empty instead of falling back to defaults",()=>{
    expect(pageBlocksFor({pageSectionsByPage:{}},"team")).toEqual([]);
    expect(pageBlocksFor({},"team")).toBeUndefined();
  });
});

describe("section style settings",()=>{
  it("wraps a styled built-in in a pb-block with CSS variables",()=>{
    const styled={...builtin("b1","HERO"),settings:{headingSize:88}};
    const html=renderToStaticMarkup(<PageBlocks blocks={[styled,builtin("b2","STATS")]} builtins={builtins}/>);
    expect(html).toContain('class="pb-block"');expect(html).toContain("--pb-heading:88px");
    expect(html.match(/pb-block/g)?.length).toBe(1);
  });
  it("wraps a styled custom section",()=>{
    const html=renderToStaticMarkup(<PageBlocks blocks={[{...custom("c1","Styled"),settings:{bodySize:19}}]} builtins={builtins}/>);
    expect(html).toContain("--pb-body:19px");expect(html).toContain("Styled");
  });
});
