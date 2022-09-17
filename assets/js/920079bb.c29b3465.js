"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[969],{3905:(e,t,n)=>{n.d(t,{Zo:()=>u,kt:()=>h});var o=n(7294);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,o)}return n}function r(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,o,i=function(e,t){if(null==e)return{};var n,o,i={},a=Object.keys(e);for(o=0;o<a.length;o++)n=a[o],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(o=0;o<a.length;o++)n=a[o],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var s=o.createContext({}),c=function(e){var t=o.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):r(r({},t),e)),n},u=function(e){var t=c(e.components);return o.createElement(s.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return o.createElement(o.Fragment,{},t)}},p=o.forwardRef((function(e,t){var n=e.components,i=e.mdxType,a=e.originalType,s=e.parentName,u=l(e,["components","mdxType","originalType","parentName"]),p=c(n),h=i,m=p["".concat(s,".").concat(h)]||p[h]||d[h]||a;return n?o.createElement(m,r(r({ref:t},u),{},{components:n})):o.createElement(m,r({ref:t},u))}));function h(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var a=n.length,r=new Array(a);r[0]=p;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l.mdxType="string"==typeof e?e:i,r[1]=l;for(var c=2;c<a;c++)r[c]=n[c];return o.createElement.apply(null,r)}return o.createElement.apply(null,n)}p.displayName="MDXCreateElement"},8975:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>s,contentTitle:()=>r,default:()=>d,frontMatter:()=>a,metadata:()=>l,toc:()=>c});var o=n(7462),i=(n(7294),n(3905));const a={sidebar_position:7},r="FAQ",l={unversionedId:"docs/FAQ",id:"docs/FAQ",title:"FAQ",description:"Common",source:"@site/docs/docs/FAQ.md",sourceDirName:"docs",slug:"/docs/FAQ",permalink:"/perfsee/docs/docs/FAQ",draft:!1,editUrl:"https://github.com/perfsee/perfsee/tree/main/docs/docs/docs/FAQ.md",tags:[],version:"current",sidebarPosition:7,frontMatter:{sidebar_position:7},sidebar:"documentsSidebar",previous:{title:"Schedule Setting",permalink:"/perfsee/docs/docs/settings/schedule-setting"}},s={},c=[{value:"Common",id:"common",level:2},{value:"Task stuck in Pending status for long time?",id:"task-stuck-in-pending-status-for-long-time",level:3},{value:"Bundle",id:"bundle",level:2},{value:"Syntax error in while using plugins?",id:"syntax-error-in-while-using-plugins",level:3},{value:"How the baseline of bundle analysis get chosen?",id:"how-the-baseline-of-bundle-analysis-get-chosen",level:3},{value:"How do I know whether I successfully upload SourceMap with bundle?",id:"how-do-i-know-whether-i-successfully-upload-sourcemap-with-bundle",level:3},{value:"Lab",id:"lab",level:2},{value:"How to compare multiple reports?",id:"how-to-compare-multiple-reports",level:3},{value:"How to test the page that need login?",id:"how-to-test-the-page-that-need-login",level:3},{value:"How the performance score calculated?",id:"how-the-performance-score-calculated",level:3},{value:"Resource loading time is too long, is there network delay?",id:"resource-loading-time-is-too-long-is-there-network-delay",level:3},{value:"Source",id:"source",level:2},{value:"Plugin is realtime scanning when using it, so will it affect the coding efficiency.",id:"plugin-is-realtime-scanning-when-using-it-so-will-it-affect-the-coding-efficiency",level:3},{value:"Plugin shows \u201cmissing commit in local\u201d",id:"plugin-shows-missing-commit-in-local",level:3},{value:"No date after install the plugin",id:"no-date-after-install-the-plugin",level:3}],u={toc:c};function d(e){let{components:t,...a}=e;return(0,i.kt)("wrapper",(0,o.Z)({},u,a,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"faq"},"FAQ"),(0,i.kt)("h2",{id:"common"},"Common"),(0,i.kt)("h3",{id:"task-stuck-in-pending-status-for-long-time"},"Task stuck in Pending status for long time?"),(0,i.kt)("p",null,"The analysis tasks on our platform are pushed in an FIFO queue and executed if an worker is available. It may take a some time to wait a worker in busy period. You can view the current status of task queue by accessing the ",(0,i.kt)("strong",{parentName:"p"},"Status")," of platform."),(0,i.kt)("h2",{id:"bundle"},"Bundle"),(0,i.kt)("h3",{id:"syntax-error-in-while-using-plugins"},"Syntax error in while using plugins?"),(0,i.kt)("p",null,"Only support node version >= ",(0,i.kt)("strong",{parentName:"p"},"12")),(0,i.kt)("h3",{id:"how-the-baseline-of-bundle-analysis-get-chosen"},"How the baseline of bundle analysis get chosen?"),(0,i.kt)("p",null,"Baseline pickup rule follows the ",(0,i.kt)("a",{parentName:"p",href:"./settings/basic-setting#Bundle-baseline-Branch"},"Bundle Baseline branch")," setting, which is ",(0,i.kt)("inlineCode",{parentName:"p"},"master")," by default and you can update it to any branch name or Regular Expression, ",(0,i.kt)("inlineCode",{parentName:"p"},"^v(\\d+\\.\\d+\\.\\d+)$")," for example."),(0,i.kt)("p",null,"It base on the ",(0,i.kt)("inlineCode",{parentName:"p"},"Bundle Baseline Branch")," setting in project settings. It default to be ",(0,i.kt)("inlineCode",{parentName:"p"},"master")," branch, if you want to change you can go to project settings."),(0,i.kt)("h3",{id:"how-do-i-know-whether-i-successfully-upload-sourcemap-with-bundle"},"How do I know whether I successfully upload SourceMap with bundle?"),(0,i.kt)("p",null,"We provide a ",(0,i.kt)("inlineCode",{parentName:"p"},"Notice")," level bundle audit called ",(0,i.kt)("inlineCode",{parentName:"p"},"Missing sourcemap for js assets")," which will tell you whether the SourceMaps are uploaded successfully."),(0,i.kt)("p",null,"If you see this result in the bundle audit, it means we didn't find any correspoding SourceMap for the js assets."),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"audit sourcemap",src:n(3580).Z,width:"1292",height:"220"})),(0,i.kt)("h2",{id:"lab"},"Lab"),(0,i.kt)("h3",{id:"how-to-compare-multiple-reports"},"How to compare multiple reports?"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"./lab/multi-reports"},"Comparing multiple reports"),"."),(0,i.kt)("h3",{id:"how-to-test-the-page-that-need-login"},"How to test the page that need login?"),(0,i.kt)("p",null,"Configure Cookies or Headers to authenticate logins in the project's ",(0,i.kt)("a",{parentName:"p",href:"./settings/environment-setting"},"Environment Settings"),"."),(0,i.kt)("h3",{id:"how-the-performance-score-calculated"},"How the performance score calculated?"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://web.dev/performance-scoring/"},"Performance Scoring")),(0,i.kt)("h3",{id:"resource-loading-time-is-too-long-is-there-network-delay"},"Resource loading time is too long, is there network delay?"),(0,i.kt)("ol",null,(0,i.kt)("li",{parentName:"ol"},"First of all, Lab runs in the standard environment, even if there is network delay, it's uncontrollable. So we suggest you to trigger the task again to check the result."),(0,i.kt)("li",{parentName:"ol"},"If the abnormal resource is in CDN, check if the resource hit cache."),(0,i.kt)("li",{parentName:"ol"},"If it is API request, please check your own logic and monitor.")),(0,i.kt)("h2",{id:"source"},"Source"),(0,i.kt)("h3",{id:"plugin-is-realtime-scanning-when-using-it-so-will-it-affect-the-coding-efficiency"},"Plugin is realtime scanning when using it, so will it affect the coding efficiency."),(0,i.kt)("p",null,"No, VSCode plugin system promise to isolate the plugin and editor running in different processes, so the plugin won't cause any crash or delay."),(0,i.kt)("p",null,"If you feel there are too many performance information in codes and make some interference to coding, you can click the Performance button in the status bar to disable the performance information."),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"vscode plugin disable",src:n(9007).Z,width:"894",height:"264"})),(0,i.kt)("h3",{id:"plugin-shows-missing-commit-in-local"},"Plugin shows \u201cmissing commit in local\u201d"),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"vscode plugin missing commit",src:n(4059).Z,width:"930",height:"926"})),(0,i.kt)("p",null,"It is because the plugin doesn't find the commit in local, which is usually because the local git repository is not updated. You can run ",(0,i.kt)("inlineCode",{parentName:"p"},"git fetch")," to fix it. Missing commit won't affect the plugin and only few features need to read commit."),(0,i.kt)("h3",{id:"no-date-after-install-the-plugin"},"No date after install the plugin"),(0,i.kt)("p",null,"Ensure the project opened in VSCode has the corresponding project in platform, and the project is correctly connected to Bundle and Lab modules. Lab module's scan will be triggered by publish platform, or you can manually set commit to Lab Snapshot."))}d.isMDXComponent=!0},3580:(e,t,n)=>{n.d(t,{Z:()=>o});const o=n.p+"assets/images/audit-sourcemap-26f3f4ee2e79a002971aee6f42edbd73.png"},9007:(e,t,n)=>{n.d(t,{Z:()=>o});const o=n.p+"assets/images/vscode-plugin-disable-d8c549c5a556d6c53cde4114d16aaf78.png"},4059:(e,t,n)=>{n.d(t,{Z:()=>o});const o=n.p+"assets/images/vscode-plugin-missing-commit-b1d51121bb4e9ef2a730e0f21c0f4510.png"}}]);