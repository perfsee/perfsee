"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[36],{3905:(e,t,a)=>{a.d(t,{Zo:()=>u,kt:()=>m});var n=a(7294);function r(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function p(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,n)}return a}function l(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?p(Object(a),!0).forEach((function(t){r(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):p(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function i(e,t){if(null==e)return{};var a,n,r=function(e,t){if(null==e)return{};var a,n,r={},p=Object.keys(e);for(n=0;n<p.length;n++)a=p[n],t.indexOf(a)>=0||(r[a]=e[a]);return r}(e,t);if(Object.getOwnPropertySymbols){var p=Object.getOwnPropertySymbols(e);for(n=0;n<p.length;n++)a=p[n],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(r[a]=e[a])}return r}var o=n.createContext({}),s=function(e){var t=n.useContext(o),a=t;return e&&(a="function"==typeof e?e(t):l(l({},t),e)),a},u=function(e){var t=s(e.components);return n.createElement(o.Provider,{value:t},e.children)},c={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},d=n.forwardRef((function(e,t){var a=e.components,r=e.mdxType,p=e.originalType,o=e.parentName,u=i(e,["components","mdxType","originalType","parentName"]),d=s(a),m=r,k=d["".concat(o,".").concat(m)]||d[m]||c[m]||p;return a?n.createElement(k,l(l({ref:t},u),{},{components:a})):n.createElement(k,l({ref:t},u))}));function m(e,t){var a=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var p=a.length,l=new Array(p);l[0]=d;var i={};for(var o in t)hasOwnProperty.call(t,o)&&(i[o]=t[o]);i.originalType=e,i.mdxType="string"==typeof e?e:r,l[1]=i;for(var s=2;s<p;s++)l[s]=a[s];return n.createElement.apply(null,l)}return n.createElement.apply(null,a)}d.displayName="MDXCreateElement"},244:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>o,contentTitle:()=>l,default:()=>c,frontMatter:()=>p,metadata:()=>i,toc:()=>s});var n=a(7462),r=(a(7294),a(3905));const p={sidebar_position:6},l="\u5982\u4f55\u8fdb\u884c E2E \u6d4b\u8bd5",i={unversionedId:"docs/lab/e2e",id:"docs/lab/e2e",title:"\u5982\u4f55\u8fdb\u884c E2E \u6d4b\u8bd5",description:"\u8be5\u529f\u80fd\u8fd8\u5728\u5b9e\u9a8c\u4e2d\uff01",source:"@site/i18n/cn/docusaurus-plugin-content-docs/current/docs/lab/e2e.md",sourceDirName:"docs/lab",slug:"/docs/lab/e2e",permalink:"/perfsee/cn/docs/docs/lab/e2e",draft:!1,editUrl:"https://github.com/perfsee/perfsee/tree/main/docs/docs/docs/lab/e2e.md",tags:[],version:"current",sidebarPosition:6,frontMatter:{sidebar_position:6},sidebar:"documentsSidebar",previous:{title:"\u5173\u8054 Commit",permalink:"/perfsee/cn/docs/docs/lab/set-commit"},next:{title:"\u6307\u6807\u8bf4\u660e",permalink:"/perfsee/cn/docs/docs/lab/metrics-gallery"}},o={},s=[{value:"\u80cc\u666f",id:"\u80cc\u666f",level:2},{value:"\u529f\u80fd",id:"\u529f\u80fd",level:2},{value:"\u4f7f\u7528\u65b9\u6cd5",id:"\u4f7f\u7528\u65b9\u6cd5",level:2},{value:"Step 0\uff1a\u6dfb\u52a0\u8fd0\u884c\u73af\u5883",id:"step-0\u6dfb\u52a0\u8fd0\u884c\u73af\u5883",level:3},{value:"Step 1\uff1a\u6dfb\u52a0 E2E \u9875\u9762",id:"step-1\u6dfb\u52a0-e2e-\u9875\u9762",level:3},{value:"Step 2\uff1a\u7f16\u5199 E2E \u811a\u672c",id:"step-2\u7f16\u5199-e2e-\u811a\u672c",level:3},{value:"E2E \u811a\u672c\u73af\u5883",id:"e2e-\u811a\u672c\u73af\u5883",level:4},{value:"\u793a\u4f8b",id:"\u793a\u4f8b",level:4},{value:"User Flow",id:"user-flow",level:4},{value:"Step 3\uff1a\u89e6\u53d1\u4e00\u6b21 E2E \u6d4b\u8bd5\uff08\u624b\u52a8\uff09",id:"step-3\u89e6\u53d1\u4e00\u6b21-e2e-\u6d4b\u8bd5\u624b\u52a8",level:3},{value:"Step 4\uff1a\u67e5\u770b\u6d4b\u8bd5\u7ed3\u679c",id:"step-4\u67e5\u770b\u6d4b\u8bd5\u7ed3\u679c",level:3},{value:"\u6982\u89c8",id:"\u6982\u89c8",level:4},{value:"User Flow",id:"user-flow-1",level:4}],u={toc:s};function c(e){let{components:t,...p}=e;return(0,r.kt)("wrapper",(0,n.Z)({},u,p,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"\u5982\u4f55\u8fdb\u884c-e2e-\u6d4b\u8bd5"},"\u5982\u4f55\u8fdb\u884c E2E \u6d4b\u8bd5"),(0,r.kt)("admonition",{type:"caution"},(0,r.kt)("p",{parentName:"admonition"},"\u8be5\u529f\u80fd\u8fd8\u5728\u5b9e\u9a8c\u4e2d\uff01")),(0,r.kt)("h2",{id:"\u80cc\u666f"},"\u80cc\u666f"),(0,r.kt)("p",null,"\u76ee\u524d\u7684 Lab \u6a21\u5757\u6d4b\u8bd5\u53ea\u9762\u5411\u9996\u5c4f\u6027\u80fd\uff0c\u65e0\u6cd5\u6d4b\u8bd5\u7528\u6237\u4ea4\u4e92\u64cd\u4f5c\u6027\u80fd\u3002"),(0,r.kt)("p",null,"\u5728\u505a\u6027\u80fd\u5206\u6790\u65f6\uff0c\u5bf9\u4e8e\u4e00\u4e9b\u7528\u6237\u4ea4\u4e92\u7684\u6027\u80fd\u6307\u6807\uff0c\u53ea\u80fd\u4f7f\u7528 chrome devtool \u624b\u52a8\u6d4b\u91cf\u624b\u52a8\u7edf\u8ba1\uff0c\u6240\u4ee5\u9700\u8981\u4e00\u79cd\u80fd\u591f\u81ea\u52a8\u6d4b\u91cf\u9875\u9762\u4ea4\u4e92\u6027\u80fd\u5e76\u91cf\u5316\u6210\u6027\u80fd\u6307\u6807\u7684\u65b9\u6cd5\u3002"),(0,r.kt)("h2",{id:"\u529f\u80fd"},"\u529f\u80fd"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("p",{parentName:"li"},"\u652f\u6301\u8fd0\u884c\u7528\u6237\u63d0\u4f9b\u7684 Puppeteer \u811a\u672c\uff0c\u6d4b\u8bd5\u9875\u9762\u529f\u80fd\u548c\u7528\u6237\u4ea4\u4e92\u6027\u80fd\u3002")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("p",{parentName:"li"},"\u96c6\u6210 ",(0,r.kt)("a",{parentName:"p",href:"https://web.dev/lighthouse-user-flows/"},"Lighthouse User Flow")," \u529f\u80fd\uff0c\u8861\u91cf\u6027\u80fd\u6307\u6807\uff0c\u5206\u6790\u9875\u9762\u6027\u80fd\u95ee\u9898\uff0c\u63d0\u4f9b\u6700\u4f73\u5b9e\u8df5\u5efa\u8bae\u3002")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("p",{parentName:"li"},"\u4e13\u6ce8\u4e8e\u6027\u80fd\u7684\u5206\u6790\uff0c\u63d0\u4f9b\u5982\u706b\u7130\u56fe\uff0cTreemap\uff0cLighthouse \u7b49\u6027\u80fd\u5206\u6790\u5de5\u5177\u3002")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("p",{parentName:"li"},"\u7ed3\u5408 Source \u529f\u80fd\uff0c\u5c06\u6027\u80fd\u95ee\u9898\u5b9a\u4f4d\u5230\u6e90\u7801\u4f4d\u7f6e\u3002"))),(0,r.kt)("h2",{id:"\u4f7f\u7528\u65b9\u6cd5"},"\u4f7f\u7528\u65b9\u6cd5"),(0,r.kt)("h3",{id:"step-0\u6dfb\u52a0\u8fd0\u884c\u73af\u5883"},"Step 0\uff1a\u6dfb\u52a0\u8fd0\u884c\u73af\u5883"),(0,r.kt)("p",null,"\u6309\u7167",(0,r.kt)("a",{parentName:"p",href:"./get-started"},"\u4ece 0 \u5f00\u59cb\u7684 Lab \u5206\u6790\u6d41\u7a0b"),"\u4e2d\u7684\u6b65\u9aa4\u521b\u5efa Profile \u548c Environment\u3002"),(0,r.kt)("h3",{id:"step-1\u6dfb\u52a0-e2e-\u9875\u9762"},"Step 1\uff1a\u6dfb\u52a0 E2E \u9875\u9762"),(0,r.kt)("p",null,"\u5728\u8bbe\u7f6e\u9875\u9762\u5207\u6362\u5230 E2E Tab \u4e4b\u540e\uff0c\u53ef\u4ee5\u7ba1\u7406\u9879\u76ee\u7684 E2E \u754c\u9762\u3002\u70b9\u51fb ",(0,r.kt)("inlineCode",{parentName:"p"},"Create a new E2E test")," \u6309\u94ae\u53ef\u4ee5\u521b\u5efa E2E \u9875\u9762\u3002"),(0,r.kt)("p",null,"\u76ee\u524d E2E \u529f\u80fd\u8fd8\u5904\u4e8e\u5b9e\u9a8c\u9636\u6bb5\uff0c\u5165\u53e3\u672a\u5f00\u653e\uff0c\u53ef\u4ee5\u5728\u5730\u5740\u680f\u624b\u52a8\u8f93\u5165\u8fdb\u5165: ",(0,r.kt)("strong",{parentName:"p"},"settings/e2e")),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"img",src:a(2477).Z,width:"2622",height:"792"})),(0,r.kt)("p",null,"E2E \u9875\u9762\u914d\u7f6e\u4e0e\u666e\u901a Pages \u4fdd\u6301\u4e00\u81f4\uff0c\u53c2\u8003 ",(0,r.kt)("a",{parentName:"p",href:"https://"},"Pages \u914d\u7f6e"),"\u67e5\u770b\u66f4\u591a\u7ec6\u8282\u3002"),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"img",src:a(9977).Z,width:"2600",height:"1494"})),(0,r.kt)("h3",{id:"step-2\u7f16\u5199-e2e-\u811a\u672c"},"Step 2\uff1a\u7f16\u5199 E2E \u811a\u672c"),(0,r.kt)("p",null,"\u672c\u5e73\u53f0\u4f7f\u7528 ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/puppeteer/puppeteer"},"puppeteer")," \u6765\u8fd0\u884c E2E \u6d4b\u8bd5\uff0cE2E \u811a\u672c\u517c\u5bb9\u5927\u90e8\u5206\u5e38\u7528 puppeteer API\u3002"),(0,r.kt)("h4",{id:"e2e-\u811a\u672c\u73af\u5883"},"E2E \u811a\u672c\u73af\u5883"),(0,r.kt)("p",null,"\u5728\u8fd0\u884c E2E \u811a\u672c\u524d\u4f1a\u9884\u5148\u521b\u5efa Puppeteer \u5b9e\u4f8b\uff0c\u6253\u5f00\u6d4f\u89c8\u5668\u5e76\u521b\u5efa\u6807\u7b7e\u9875\uff0c\u5e76\u5c06\u5e73\u53f0\u4e0a\u914d\u7f6e\u7684 Profiles \u548c Environments \u81ea\u52a8\u6ce8\u5165\u5230\u6d4f\u89c8\u5668\u6807\u7b7e\u9875\u4e2d\u3002\u6807\u7b7e\u9875\u4f1a\u88ab\u6ce8\u5165\u5230\u811a\u672c\u73af\u5883\u5168\u5c40\u53d8\u91cf ",(0,r.kt)("inlineCode",{parentName:"p"},"page")," \u4e2d\u3002 E2E \u811a\u672c\u53ea\u9700\u8981\u8c03\u7528 ",(0,r.kt)("inlineCode",{parentName:"p"},"page")," \u4e0a\u7684\u65b9\u6cd5\u5373\u53ef\u5bf9\u9875\u9762\u8fdb\u884c\u64cd\u4f5c\u3002\u66f4\u591a\u65b9\u6cd5\u8bf7\u770b ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/puppeteer/puppeteer/blob/v13.0.1/docs/api.md#class-page"},"puppeteer Page \u7c7b API"),"\u3002"),(0,r.kt)("h4",{id:"\u793a\u4f8b"},"\u793a\u4f8b"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-javascript"},"await page.goto('https://a.b.c/')\n\n// \u70b9\u51fb class \u4e3a ms-List-cell \u5e76\u4e14\u5305\u542bappmonitor/main \u7684 div\n\nconst [project] = await page.$x(\"//div[contains(@class, 'ms-List-cell') and contains(., 'appmonitor/main')]\")\n\nawait project.click()\n\n// \u7b49\u5f85\u9875\u9762\u8df3\u8f6c\n\nawait page.waitForNetworkIdle()\n")),(0,r.kt)("h4",{id:"user-flow"},"User Flow"),(0,r.kt)("p",null,"\u4e3a\u4e86\u5728\u8fd0\u884c\u65f6\u5206\u6790\u7528\u6237\u64cd\u4f5c\u7684\u6027\u80fd\u6307\u6807\uff0c\u5982\u6bcf\u6b21\u8df3\u8f6c\u7684\u8017\u65f6\uff0c\u6bcf\u6b21\u70b9\u51fb\u7684\u54cd\u5e94\u65f6\u95f4\u7b49\uff0c\u6211\u4eec\u4f1a\u5c06\u6574\u4e2a\u811a\u672c\u5206\u6210\u82e5\u5e72\u4e2a Steps\uff0c\u6bcf\u4e2a Step \u90fd\u4f1a\u4ea7\u751f\u6027\u80fd\u6307\u6807\u3002"),(0,r.kt)("p",null,"\u5728\u811a\u672c\u4e2d\u89e6\u53d1\u4ee5\u4e0b\u64cd\u4f5c\u65f6\u81ea\u52a8\u5f00\u59cb\u4e00\u4e2a Step\u3002"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"goto"),(0,r.kt)("li",{parentName:"ul"},"reload"),(0,r.kt)("li",{parentName:"ul"},"goBack"),(0,r.kt)("li",{parentName:"ul"},"goForward"),(0,r.kt)("li",{parentName:"ul"},"click"),(0,r.kt)("li",{parentName:"ul"},"focus"),(0,r.kt)("li",{parentName:"ul"},"hover"),(0,r.kt)("li",{parentName:"ul"},"select"),(0,r.kt)("li",{parentName:"ul"},"tap"),(0,r.kt)("li",{parentName:"ul"},"type"),(0,r.kt)("li",{parentName:"ul"},"Mouse \u7c7b\u7684\u5168\u90e8\u65b9\u6cd5"),(0,r.kt)("li",{parentName:"ul"},"Touchscreen \u7c7b\u7684\u5168\u90e8\u65b9\u6cd5"),(0,r.kt)("li",{parentName:"ul"},"Keyboard \u7c7b\u7684\u5168\u90e8\u65b9\u6cd5"),(0,r.kt)("li",{parentName:"ul"},"ElementHandle \u7c7b\u7684 drag&drop \u65b9\u6cd5")),(0,r.kt)("p",null,"\u5982\u679c\u4f60\u60f3\u628a\u591a\u4e2a\u64cd\u4f5c\u5408\u5e76\u4e3a\u4e00\u4e2a Step\uff0c\u5982\u9f20\u6807\u6309\u4e0b\u3001\u79fb\u52a8\u3001\u518d\u677e\u5f00\u6a21\u62df\u62d6\u62fd\u64cd\u4f5c\uff0c\u9700\u8981\u4f7f\u7528\u5168\u5c40\u5bf9\u8c61 ",(0,r.kt)("inlineCode",{parentName:"p"},"flow")," \u4e0a\u7684 ",(0,r.kt)("inlineCode",{parentName:"p"},"startStep")," \u548c ",(0,r.kt)("inlineCode",{parentName:"p"},"endStep")," \u65b9\u6cd5\u3002"),(0,r.kt)("p",null,"\u4f8b\u5982\uff1a"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-javascript"},"await flow.startStep('<Step Name>')\n\nawait page.mouse.down()\nawait page.mouse.move(0, 100)\nawait page.mouse.move(100, 100)\nawait page.mouse.move(100, 0)\nawait page.mouse.move(0, 0)\nawait page.mouse.up()\n\nawait flow.endStep()\n")),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},"page.goto \u662f\u7279\u6b8a\u7684 Step \u4e0d\u5e94\u8be5\u5728 ",(0,r.kt)("inlineCode",{parentName:"strong"},"flow.startStep")," \u548c ",(0,r.kt)("inlineCode",{parentName:"strong"},"flow.endStep")," \u4e4b\u95f4\u8c03\u7528\u3002")),(0,r.kt)("h3",{id:"step-3\u89e6\u53d1\u4e00\u6b21-e2e-\u6d4b\u8bd5\u624b\u52a8"},"Step 3\uff1a\u89e6\u53d1\u4e00\u6b21 E2E \u6d4b\u8bd5\uff08\u624b\u52a8\uff09"),(0,r.kt)("p",null,"\u5728 Lab \u6a21\u5757\u4e2d\u70b9\u51fb\u5217\u8868\u53f3\u4e0a\u65b9\u7684 ",(0,r.kt)("inlineCode",{parentName:"p"},"Take a snapshot")," \u6309\u94ae\u9009\u62e9",(0,r.kt)("inlineCode",{parentName:"p"},"Select existed pages"),"\uff0c\u9009\u62e9\u521a\u521a\u521b\u5efa\u7684 E2E \u9875\u9762\uff0c\u70b9\u51fb ",(0,r.kt)("inlineCode",{parentName:"p"},"Save")," \u5c31\u53ef\u4ee5\u624b\u52a8\u89e6\u53d1\u4e00\u6b21\u626b\u63cf\u3002"),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"img",src:a(9480).Z,width:"2506",height:"1382"})),(0,r.kt)("h3",{id:"step-4\u67e5\u770b\u6d4b\u8bd5\u7ed3\u679c"},"Step 4\uff1a\u67e5\u770b\u6d4b\u8bd5\u7ed3\u679c"),(0,r.kt)("p",null,"\u5728 Lab \u6a21\u5757\u70b9\u51fb\u521a\u521a\u89e6\u53d1\u7684 Snapshot \u5361\u7247\u5c06\u4f1a\u5f39\u51fa\u8be5 Snapshot \u4e2d\u5305\u542b\u7684\u6240\u6709\u8fd0\u884c\u7ed3\u679c\uff0c\u7b49\u5f85 E2E \u9875\u9762\u7684 Status \u53d8\u4e3a Completed \u4e4b\u540e\uff0c\u70b9\u51fb\u8fdb\u5165 e2e \u7ed3\u679c\u9875\u9762\u3002"),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"img",src:a(9050).Z,width:"2594",height:"866"})),(0,r.kt)("h4",{id:"\u6982\u89c8"},"\u6982\u89c8"),(0,r.kt)("p",null,"\u8fdb\u5165\u62a5\u544a\u9875\u9762\u540e\uff0c\u4f1a\u663e\u793a\u6b64\u6b21 E2E \u811a\u672c\u6267\u884c\u7684\u8017\u65f6\u548c Step \u7684\u6570\u91cf\uff0c\u4ee5\u53ca\u4e00\u4e2a\u8fd0\u884c\u5f55\u5c4f\u3002"),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"img",src:a(2485).Z,width:"2398",height:"1130"})),(0,r.kt)("h4",{id:"user-flow-1"},"User Flow"),(0,r.kt)("p",null,"\u70b9\u51fb\u62a5\u544a\u9875\u9762\u4e2d\u7684 User Flow \u6807\u7b7e\u9875\uff0c\u53ef\u4ee5\u770b\u5230\u6bcf\u4e2a Step \u7684\u6027\u80fd\u5206\u6790\u6570\u636e\u548c\u4f18\u5316\u5efa\u8bae\u3002\u70b9\u51fb\u65f6\u95f4\u8f74\u4e0a\u7684\u7f29\u7565\u56fe\u53ef\u4ee5\u8df3\u8f6c\u5230\u540e\u4e00\u4e2a Step\u3002"),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"img",src:a(9417).Z,width:"2296",height:"1630"})))}c.isMDXComponent=!0},2485:(e,t,a)=>{a.d(t,{Z:()=>n});const n=a.p+"assets/images/e2e-report-overview-ab0a72c0430b3d7d170e15aad0891163.png"},9417:(e,t,a)=>{a.d(t,{Z:()=>n});const n=a.p+"assets/images/e2e-report-userflow-08532d3839415741111c30fa72d5fb35.png"},9050:(e,t,a)=>{a.d(t,{Z:()=>n});const n=a.p+"assets/images/e2e-take-snapshot-detail-746787a548dc419609bb42d3b91925a0.png"},9480:(e,t,a)=>{a.d(t,{Z:()=>n});const n=a.p+"assets/images/e2e-take-snapshot-27fca626b2dbbea0be462acace6095bd.png"},9977:(e,t,a)=>{a.d(t,{Z:()=>n});const n=a.p+"assets/images/create-e2e-f0628260e30d988654e265b43638bab7.png"},2477:(e,t,a)=>{a.d(t,{Z:()=>n});const n=a.p+"assets/images/e2e-f856562e37e450e9c0a3e6eff571f092.png"}}]);