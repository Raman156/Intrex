import{r as S,j as e,u as D,b as A,d as C,R as k}from"./index-BTVF0u6w.js";import{m as v}from"./motion-BzLk7TfP.js";import{A as I}from"./index-Dr24dUz1.js";function M(t){var a,p,m;if(!t)throw new Error("No session result provided");return`
INTERVIEW RESULTS REPORT
========================

Session Information:
- Session ID: ${t.sessionId}
- Date: ${new Date(t.timestamp).toLocaleDateString()}
- Targeted Role: ${t.targetedRole}
- Total Questions: ${t.totalQuestions}
- Questions Answered: ${t.answeredQuestions}
- Questions Skipped: ${t.skippedQuestions}

Overall Performance:
- Average Score: ${t.averageScore}/100
- Total Time Used: ${Math.floor(t.totalTimeUsed/60)}:${(t.totalTimeUsed%60).toString().padStart(2,"0")}

Performance Metrics:
- Analysis Success Rate: ${((a=t.metadata)==null?void 0:a.analysisSuccessRate)||0}%
- Average Time Per Question: ${((p=t.metadata)==null?void 0:p.averageTimePerQuestion)||0}s
- Completion Rate: ${((m=t.metadata)==null?void 0:m.completionRate)||0}%

COACHING SUMMARY
================

Overall Feedback:
${t.overallFeedback}

Top Strengths:
${t.topStrengths.map((r,l)=>`${l+1}. ${r}`).join(`
`)}

Critical Improvements:
${t.criticalImprovements.map((r,l)=>`${l+1}. ${r}`).join(`
`)}

Recommended Focus:
${t.recommendedFocus}

DETAILED QUESTION ANALYSIS
===========================

${t.questionResults.map((r,l)=>{var o,s,u,n,y,g,d;return`
Question ${l+1}:
${r.questionId?`ID: ${r.questionId}`:""}

Scores:
- Relevance: ${((o=r.scores)==null?void 0:o.relevance)||0}/10
- Clarity: ${((s=r.scores)==null?void 0:s.clarity)||0}/10
- Technical Depth: ${((u=r.scores)==null?void 0:u.technicalDepth)||0}/10
- Confidence: ${((n=r.scores)==null?void 0:n.confidence)||0}/10
- Overall: ${((y=r.scores)==null?void 0:y.overall)||0}/100

Assessment: ${r.verdict||"No assessment available"}

Strengths:
${((g=r.strengths)==null?void 0:g.map(x=>`- ${x}`).join(`
`))||"- None identified"}

Areas for Improvement:
${((d=r.improvements)==null?void 0:d.map(x=>`- ${x}`).join(`
`))||"- None identified"}

${"=".repeat(50)}
`}).join(`
`)}

Report generated on: ${new Date().toLocaleString()}
Powered by AI Interview Analyzer
  `.trim()}function Q(t,i=null){try{const a=M(t),p=new Blob([a],{type:"text/plain;charset=utf-8"}),m=URL.createObjectURL(p),r=`interview-report-${new Date().toISOString().split("T")[0]}.txt`,l=i||r,o=document.createElement("a");return o.href=m,o.download=l,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(m),!0}catch(a){return console.error("Error generating report:",a),!1}}function E(t){if(!t)throw new Error("No session result provided");return`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Results Report</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .score-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
        .score-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .question-card { background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #007bff; }
        .strengths { color: #28a745; }
        .improvements { color: #ffc107; }
        .list-item { margin: 5px 0; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Interview Results Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="section">
        <h2>Session Overview</h2>
        <div class="score-grid">
            <div class="score-card">
                <div class="score-value">${t.averageScore}</div>
                <div>Average Score</div>
            </div>
            <div class="score-card">
                <div class="score-value">${t.answeredQuestions}</div>
                <div>Questions Answered</div>
            </div>
            <div class="score-card">
                <div class="score-value">${t.totalQuestions}</div>
                <div>Total Questions</div>
            </div>
            <div class="score-card">
                <div class="score-value">${Math.floor(t.totalTimeUsed/60)}:${(t.totalTimeUsed%60).toString().padStart(2,"0")}</div>
                <div>Total Time</div>
            </div>
        </div>
        <p><strong>Targeted Role:</strong> ${t.targetedRole}</p>
        <p><strong>Session ID:</strong> ${t.sessionId}</p>
    </div>

    <div class="section">
        <h2>Coaching Summary</h2>
        <p><strong>Overall Feedback:</strong> ${t.overallFeedback}</p>
        
        <h3 class="strengths">Top Strengths</h3>
        <ul>
            ${t.topStrengths.map(a=>`<li class="list-item">${a}</li>`).join("")}
        </ul>
        
        <h3 class="improvements">Critical Improvements</h3>
        <ul>
            ${t.criticalImprovements.map(a=>`<li class="list-item">${a}</li>`).join("")}
        </ul>
        
        <p><strong>Recommended Focus:</strong> ${t.recommendedFocus}</p>
    </div>

    <div class="section">
        <h2>Question Analysis</h2>
        ${t.questionResults.map((a,p)=>{var m,r,l,o;return`
            <div class="question-card">
                <h3>Question ${p+1}</h3>
                <div class="score-grid">
                    <div class="score-card">
                        <div class="score-value">${((m=a.scores)==null?void 0:m.overall)||0}</div>
                        <div>Overall Score</div>
                    </div>
                    <div class="score-card">
                        <div class="score-value">${((r=a.scores)==null?void 0:r.relevance)||0}</div>
                        <div>Relevance</div>
                    </div>
                    <div class="score-card">
                        <div class="score-value">${((l=a.scores)==null?void 0:l.clarity)||0}</div>
                        <div>Clarity</div>
                    </div>
                    <div class="score-card">
                        <div class="score-value">${((o=a.scores)==null?void 0:o.technicalDepth)||0}</div>
                        <div>Technical Depth</div>
                    </div>
                </div>
                <p><strong>Assessment:</strong> ${a.verdict||"No assessment available"}</p>
                ${a.strengths&&a.strengths.length>0?`
                    <p class="strengths"><strong>Strengths:</strong></p>
                    <ul>${a.strengths.map(s=>`<li>${s}</li>`).join("")}</ul>
                `:""}
                ${a.improvements&&a.improvements.length>0?`
                    <p class="improvements"><strong>Areas for Improvement:</strong></p>
                    <ul>${a.improvements.map(s=>`<li>${s}</li>`).join("")}</ul>
                `:""}
            </div>
        `}).join("")}
    </div>

    <div class="footer">
        <p>Report generated by AI Interview Analyzer</p>
        <p>Powered by Gemini AI</p>
    </div>
</body>
</html>
  `.trim()}function L(t,i=null){try{const a=E(t),p=new Blob([a],{type:"text/html;charset=utf-8"}),m=URL.createObjectURL(p),r=`interview-report-${new Date().toISOString().split("T")[0]}.html`,l=i||r,o=document.createElement("a");return o.href=m,o.download=l,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(m),!0}catch(a){return console.error("Error generating HTML report:",a),!1}}const F="interview_sessions";function P(){try{const t=localStorage.getItem(F);return t?JSON.parse(t):[]}catch(t){return console.error("Error loading session history:",t),[]}}function U(t){return P().find(a=>a.sessionId===t)||null}function O({score:t,size:i=200,strokeWidth:a=8,className:p=""}){const[m,r]=S.useState(0),l=(i-a)/2,o=l*2*Math.PI,s=o,u=o-m/100*o,n=g=>g>=85?"#10b981":g>=70?"#3b82f6":g>=55?"#f59e0b":g>=40?"#f97316":"#ef4444",y=g=>g>=85?"Excellent":g>=70?"Good":g>=55?"Fair":g>=40?"Needs Work":"Poor";return S.useEffect(()=>{const g=setTimeout(()=>{r(t)},500);return()=>clearTimeout(g)},[t]),e.jsxs("div",{className:`relative ${p}`,children:[e.jsxs("svg",{width:i,height:i,className:"transform -rotate-90",children:[e.jsx("circle",{cx:i/2,cy:i/2,r:l,stroke:"rgba(75, 85, 99, 0.3)",strokeWidth:a,fill:"transparent"}),e.jsx(v.circle,{cx:i/2,cy:i/2,r:l,stroke:n(t),strokeWidth:a,fill:"transparent",strokeLinecap:"round",strokeDasharray:s,initial:{strokeDashoffset:o},animate:{strokeDashoffset:u},transition:{duration:2,ease:"easeInOut"}})]}),e.jsx("div",{className:"absolute inset-0 flex flex-col items-center justify-center",children:e.jsxs(v.div,{initial:{scale:0},animate:{scale:1},transition:{delay:.5,duration:.5},className:"text-center",children:[e.jsx("div",{className:"text-4xl font-bold mb-1",style:{color:n(t)},children:Math.round(m)}),e.jsx("div",{className:"text-sm text-gray-400",children:y(t)})]})})]})}function _({data:t,size:i=300,className:a=""}){const[p,m]=S.useState([0,0,0,0]),r=i/2,l=i/2-40,o=5,s=[{key:"relevance",label:"Relevance",angle:0},{key:"clarity",label:"Clarity",angle:90},{key:"technicalDepth",label:"Technical Depth",angle:180},{key:"confidence",label:"Confidence",angle:270}],u=(d,x)=>{const h=(x-90)*(Math.PI/180),j=d/10*l;return{x:r+j*Math.cos(h),y:r+j*Math.sin(h)}},n=(d,x)=>{const h=(x-90)*(Math.PI/180),j=d/o*l;return{x:r+j*Math.cos(h),y:r+j*Math.sin(h)}},y=d=>{const x=(d-90)*(Math.PI/180),h=l+25;return{x:r+h*Math.cos(x),y:r+h*Math.sin(x)}};S.useEffect(()=>{const d=setTimeout(()=>{m([t.relevance||0,t.clarity||0,t.technicalDepth||0,t.confidence||0])},500);return()=>clearTimeout(d)},[t]);const g=s.map((d,x)=>{const h=u(p[x],d.angle);return`${x===0?"M":"L"} ${h.x} ${h.y}`}).join(" ")+" Z";return e.jsx("div",{className:`relative ${a}`,children:e.jsxs("svg",{width:i,height:i,className:"overflow-visible",children:[[...Array(o)].map((d,x)=>e.jsx("circle",{cx:r,cy:r,r:(x+1)/o*l,fill:"none",stroke:"rgba(75, 85, 99, 0.2)",strokeWidth:"1"},x)),s.map(d=>{const x=n(o,d.angle);return e.jsx("line",{x1:r,y1:r,x2:x.x,y2:x.y,stroke:"rgba(75, 85, 99, 0.3)",strokeWidth:"1"},d.key)}),e.jsx(v.path,{d:g,fill:"rgba(59, 130, 246, 0.2)",stroke:"#3b82f6",strokeWidth:"2",initial:{pathLength:0,opacity:0},animate:{pathLength:1,opacity:1},transition:{duration:1.5,delay:.5}}),s.map((d,x)=>{const h=u(p[x],d.angle);return e.jsx(v.circle,{cx:h.x,cy:h.y,r:"4",fill:"#3b82f6",initial:{scale:0},animate:{scale:1},transition:{delay:.8+x*.1,duration:.3}},d.key)}),s.map((d,x)=>{const h=y(d.angle),j=p[x];return e.jsxs("g",{children:[e.jsx("text",{x:h.x,y:h.y-8,textAnchor:"middle",className:"text-xs font-medium fill-white",children:d.label}),e.jsx("text",{x:h.x,y:h.y+8,textAnchor:"middle",className:"text-xs fill-blue-400 font-bold",children:j.toFixed(1)})]},d.key)})]})})}function G({questions:t,className:i=""}){const[a,p]=S.useState(null),m=s=>{p(a===s?null:s)},r=s=>{const u=Math.floor(s/60),n=s%60;return`${u}:${n.toString().padStart(2,"0")}`},l=(s,u=10)=>{const n=s/u*100;return n>=80?"text-green-400":n>=60?"text-yellow-400":n>=40?"text-orange-400":"text-red-400"},o=s=>s>=80?"text-green-400 bg-green-500/20 border-green-500/30":s>=60?"text-yellow-400 bg-yellow-500/20 border-yellow-500/30":s>=40?"text-orange-400 bg-orange-500/20 border-orange-500/30":"text-red-400 bg-red-500/20 border-red-500/30";return e.jsx("div",{className:`space-y-4 ${i}`,children:t.map((s,u)=>{var n,y,g,d,x,h,j,$;return e.jsxs(v.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:u*.1},className:"glass rounded-xl border border-surface-border overflow-hidden",children:[e.jsx("button",{onClick:()=>m(u),className:"w-full p-6 text-left hover:bg-white/5 transition-colors",children:e.jsxs("div",{className:"flex items-start gap-4",children:[e.jsx("div",{className:"w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center flex-shrink-0 professional-glow",children:e.jsxs("span",{className:"text-white font-bold text-sm",children:["Q",u+1]})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"font-medium text-white mb-2 line-clamp-2",children:s.question}),e.jsxs("div",{className:"flex items-center gap-4 flex-wrap",children:[e.jsx("span",{className:`px-3 py-1 rounded-full text-sm font-semibold border ${s.skipped?"text-amber-400 bg-amber-500/20 border-amber-500/30":o(((y=(n=s.analysis)==null?void 0:n.scores)==null?void 0:y.overall)||0)}`,children:s.skipped?"Skipped":`${((d=(g=s.analysis)==null?void 0:g.scores)==null?void 0:d.overall)||0}/100`}),e.jsxs("span",{className:"text-xs px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30",children:[r(s.timeUsed||0)," / ",r(s.allocatedTime||120)]}),s.transcriptionStatus&&e.jsx("span",{className:`text-xs px-2 py-1 rounded-full border ${s.transcriptionStatus==="success"?"bg-green-500/20 text-green-400 border-green-500/30":"bg-red-500/20 text-red-400 border-red-500/30"}`,children:s.transcriptionStatus==="success"?"✓ Transcribed":"⚠️ Failed"})]})]}),e.jsx(v.div,{animate:{rotate:a===u?180:0},transition:{duration:.2},className:"text-gray-400",children:"↓"})]})}),e.jsx(I,{children:a===u&&e.jsx(v.div,{initial:{height:0,opacity:0},animate:{height:"auto",opacity:1},exit:{height:0,opacity:0},transition:{duration:.3},className:"border-t border-surface-border",children:e.jsx("div",{className:"p-6 space-y-6",children:s.skipped?e.jsxs("div",{className:"text-center py-8",children:[e.jsx("div",{className:"w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4",children:e.jsx("span",{className:"text-2xl",children:"⏭️"})}),e.jsx("p",{className:"text-amber-400 font-medium",children:"Question was skipped"}),e.jsxs("p",{className:"text-gray-400 text-sm mt-2",children:["Time used: ",r(s.timeUsed||0)]})]}):e.jsxs(e.Fragment,{children:[s.answer_text&&e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-semibold text-gray-300 mb-3",children:"Your Answer"}),e.jsx("div",{className:"bg-surface-elevated border border-surface-border rounded-lg p-4",children:e.jsxs("p",{className:"text-white leading-relaxed text-sm",children:['"',s.answer_text,'"']})})]}),((x=s.analysis)==null?void 0:x.scores)&&e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-semibold text-gray-300 mb-3",children:"Score Breakdown"}),e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsxs("div",{className:"bg-surface-elevated border border-surface-border rounded-lg p-3 text-center",children:[e.jsxs("div",{className:`text-xl font-bold ${l(s.analysis.scores.relevance)}`,children:[s.analysis.scores.relevance,"/10"]}),e.jsx("div",{className:"text-xs text-gray-400 mt-1",children:"Relevance"})]}),e.jsxs("div",{className:"bg-surface-elevated border border-surface-border rounded-lg p-3 text-center",children:[e.jsxs("div",{className:`text-xl font-bold ${l(s.analysis.scores.clarity)}`,children:[s.analysis.scores.clarity,"/10"]}),e.jsx("div",{className:"text-xs text-gray-400 mt-1",children:"Clarity"})]}),e.jsxs("div",{className:"bg-surface-elevated border border-surface-border rounded-lg p-3 text-center",children:[e.jsxs("div",{className:`text-xl font-bold ${l(s.analysis.scores.technicalDepth)}`,children:[s.analysis.scores.technicalDepth,"/10"]}),e.jsx("div",{className:"text-xs text-gray-400 mt-1",children:"Technical Depth"})]}),e.jsxs("div",{className:"bg-surface-elevated border border-surface-border rounded-lg p-3 text-center",children:[e.jsxs("div",{className:`text-xl font-bold ${l(s.analysis.scores.confidence)}`,children:[s.analysis.scores.confidence,"/10"]}),e.jsx("div",{className:"text-xs text-gray-400 mt-1",children:"Confidence"})]})]})]}),((h=s.analysis)==null?void 0:h.verdict)&&e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-semibold text-gray-300 mb-3",children:"Assessment"}),e.jsx("div",{className:"bg-blue-500/10 border border-blue-500/30 rounded-lg p-4",children:e.jsx("p",{className:"text-white text-sm leading-relaxed",children:s.analysis.verdict})})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[((j=s.analysis)==null?void 0:j.strengths)&&s.analysis.strengths.length>0&&e.jsxs("div",{children:[e.jsxs("h4",{className:"text-sm font-semibold text-green-400 mb-3 flex items-center gap-2",children:[e.jsx("span",{children:"✓"}),"Strengths"]}),e.jsx("ul",{className:"space-y-2",children:s.analysis.strengths.map((w,N)=>e.jsxs("li",{className:"text-sm text-gray-300 flex items-start gap-2",children:[e.jsx("span",{className:"text-green-400 mt-1 text-xs",children:"•"}),e.jsx("span",{children:w})]},N))})]}),(($=s.analysis)==null?void 0:$.improvements)&&s.analysis.improvements.length>0&&e.jsxs("div",{children:[e.jsxs("h4",{className:"text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2",children:[e.jsx("span",{children:"💡"}),"Improvements"]}),e.jsx("ul",{className:"space-y-2",children:s.analysis.improvements.map((w,N)=>e.jsxs("li",{className:"text-sm text-gray-300 flex items-start gap-2",children:[e.jsx("span",{className:"text-amber-400 mt-1 text-xs",children:"•"}),e.jsx("span",{children:w})]},N))})]})]})]})})})})]},u)})})}function H({sessionSummary:t,performanceInsights:i,className:a=""}){if(!t)return null;const p=r=>{switch(r){case"Ready":return"text-green-400 bg-green-500/20 border-green-500/30";case"Nearly Ready":return"text-yellow-400 bg-yellow-500/20 border-yellow-500/30";default:return"text-red-400 bg-red-500/20 border-red-500/30"}},m=r=>{switch(r){case"Excellent":return"text-green-400";case"Good":return"text-blue-400";case"Fair":return"text-yellow-400";default:return"text-red-400"}};return e.jsxs(v.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},className:`space-y-6 ${a}`,children:[e.jsxs("div",{className:"glass rounded-2xl p-6 border border-surface-border",children:[e.jsxs("div",{className:"flex items-center gap-3 mb-4",children:[e.jsx("div",{className:"w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center professional-glow",children:e.jsx("span",{className:"text-2xl",children:"🎯"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-xl font-semibold text-white",children:"Interview Coach Summary"}),e.jsx("p",{className:"text-sm text-gray-400",children:"AI-powered feedback and recommendations"})]})]}),e.jsx("div",{className:"bg-blue-500/10 border border-blue-500/30 rounded-lg p-4",children:e.jsx("p",{className:"text-white leading-relaxed",children:t.overallFeedback})})]}),i&&e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[e.jsxs("div",{className:"glass rounded-xl p-4 border border-surface-border",children:[e.jsx("h4",{className:"text-sm font-semibold text-gray-300 mb-3",children:"Performance Level"}),e.jsx("div",{className:`text-2xl font-bold ${m(i.performanceLevel)}`,children:i.performanceLevel})]}),e.jsxs("div",{className:"glass rounded-xl p-4 border border-surface-border",children:[e.jsx("h4",{className:"text-sm font-semibold text-gray-300 mb-3",children:"Interview Readiness"}),e.jsx("div",{className:`px-4 py-2 rounded-lg border text-center font-semibold ${p(i.readinessAssessment)}`,children:i.readinessAssessment})]})]}),e.jsxs("div",{className:"glass rounded-xl p-6 border border-surface-border",children:[e.jsxs("h4",{className:"text-lg font-semibold text-green-400 mb-4 flex items-center gap-2",children:[e.jsx("span",{children:"💪"}),"Top Strengths"]}),e.jsx("div",{className:"space-y-3",children:t.topStrengths.map((r,l)=>e.jsxs(v.div,{initial:{opacity:0,x:-20},animate:{opacity:1,x:0},transition:{delay:l*.1},className:"flex items-start gap-3 bg-green-500/10 border border-green-500/30 rounded-lg p-3",children:[e.jsx("span",{className:"text-green-400 font-bold text-sm mt-0.5",children:l+1}),e.jsx("p",{className:"text-white text-sm flex-1",children:r})]},l))})]}),e.jsxs("div",{className:"glass rounded-xl p-6 border border-surface-border",children:[e.jsxs("h4",{className:"text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2",children:[e.jsx("span",{children:"🎯"}),"Areas for Improvement"]}),e.jsx("div",{className:"space-y-3",children:t.criticalImprovements.map((r,l)=>e.jsxs(v.div,{initial:{opacity:0,x:-20},animate:{opacity:1,x:0},transition:{delay:l*.1},className:"flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3",children:[e.jsx("span",{className:"text-amber-400 font-bold text-sm mt-0.5",children:l+1}),e.jsx("p",{className:"text-white text-sm flex-1",children:r})]},l))})]}),e.jsxs("div",{className:"glass rounded-xl p-6 border border-surface-border",children:[e.jsxs("h4",{className:"text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2",children:[e.jsx("span",{children:"🎯"}),"Recommended Focus"]}),e.jsx("div",{className:"bg-blue-500/10 border border-blue-500/30 rounded-lg p-4",children:e.jsx("p",{className:"text-white leading-relaxed",children:t.recommendedFocus})})]}),(i==null?void 0:i.nextSteps)&&e.jsxs("div",{className:"glass rounded-xl p-6 border border-surface-border",children:[e.jsxs("h4",{className:"text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2",children:[e.jsx("span",{children:"📋"}),"Next Steps"]}),e.jsx("div",{className:"space-y-2",children:i.nextSteps.map((r,l)=>e.jsxs(v.div,{initial:{opacity:0,x:-20},animate:{opacity:1,x:0},transition:{delay:l*.1},className:"flex items-center gap-3 text-sm text-gray-300",children:[e.jsx("span",{className:`w-6 h-6 bg-purple-500/20 border border-purple-500/30 rounded-full \r
                  flex items-center justify-center text-purple-400 font-bold text-xs`,children:l+1}),e.jsx("span",{children:r})]},l))})]}),i&&e.jsxs("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-4",children:[e.jsxs("div",{className:"glass rounded-lg p-4 text-center border border-surface-border",children:[e.jsxs("div",{className:"text-2xl font-bold text-blue-400",children:[i.consistencyScore,"%"]}),e.jsx("div",{className:"text-xs text-gray-400 mt-1",children:"Consistency"})]}),e.jsxs("div",{className:"glass rounded-lg p-4 text-center border border-surface-border",children:[e.jsx("div",{className:`text-2xl font-bold ${i.timeManagement==="Good"?"text-green-400":i.timeManagement==="Too Slow"?"text-red-400":"text-yellow-400"}`,children:i.timeManagement}),e.jsx("div",{className:"text-xs text-gray-400 mt-1",children:"Time Mgmt"})]}),i.scoreDistribution&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"glass rounded-lg p-4 text-center border border-surface-border",children:[e.jsx("div",{className:"text-2xl font-bold text-green-400",children:i.scoreDistribution.highest}),e.jsx("div",{className:"text-xs text-gray-400 mt-1",children:"Best Score"})]}),e.jsxs("div",{className:"glass rounded-lg p-4 text-center border border-surface-border",children:[e.jsx("div",{className:"text-2xl font-bold text-red-400",children:i.scoreDistribution.lowest}),e.jsx("div",{className:"text-xs text-gray-400 mt-1",children:"Lowest Score"})]})]})]})]})}const W=({className:t=""})=>{var N,T;const i=D(),a=A(),{sessionId:p}=C(),{sessionResult:m,summary:r,insights:l,questionSessions:o}=i.state||{},[s,u]=k.useState(m||null);k.useEffect(()=>{if(m){u(m);return}if(p){const c=U(p);c&&u(c)}},[m,p]);const n=s;if(k.useEffect(()=>{n||a("/live-interview")},[n,a]),!n)return e.jsx("div",{className:"min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center",children:e.jsxs("div",{className:"text-center",children:[e.jsx("p",{className:"text-white text-xl mb-4",children:"No interview results found"}),e.jsx("button",{onClick:()=>a("/live-interview"),className:"bg-gradient-accent text-white py-3 px-6 rounded-xl hover:shadow-xl transition-all",children:"Start New Interview"})]})});const y={overall_score:n.averageScore,technical_score:Math.round(n.questionResults.reduce((c,b)=>{var f;return c+(((f=b.scores)==null?void 0:f.technicalDepth)||0)},0)/Math.max(1,n.questionResults.length)*10),behavioral_score:Math.round(n.questionResults.reduce((c,b)=>{var f,R;return c+(((f=b.scores)==null?void 0:f.clarity)||0)+(((R=b.scores)==null?void 0:R.confidence)||0)},0)/Math.max(2,n.questionResults.length*2)*10),total_questions:n.totalQuestions,answered_questions:n.answeredQuestions,skipped_questions:n.skippedQuestions,analysis_success_rate:((N=n.metadata)==null?void 0:N.analysisSuccessRate)||0,detailed_scores:n.questionResults.length>0?{relevance:Math.round(n.questionResults.reduce((c,b)=>{var f;return c+(((f=b.scores)==null?void 0:f.relevance)||0)},0)/n.questionResults.length),clarity:Math.round(n.questionResults.reduce((c,b)=>{var f;return c+(((f=b.scores)==null?void 0:f.clarity)||0)},0)/n.questionResults.length),technicalDepth:Math.round(n.questionResults.reduce((c,b)=>{var f;return c+(((f=b.scores)==null?void 0:f.technicalDepth)||0)},0)/n.questionResults.length),confidence:Math.round(n.questionResults.reduce((c,b)=>{var f;return c+(((f=b.scores)==null?void 0:f.confidence)||0)},0)/n.questionResults.length),overall:n.averageScore}:{relevance:0,clarity:0,technicalDepth:0,confidence:0,overall:0}},g=y.detailed_scores,d=((T=n.questionResults)==null?void 0:T.map(c=>({questionText:c.questionText,transcript:c.answerText,analysis:c,timeUsed:c.timeUsed,allocatedTime:c.allocatedTime,skipped:c.skipped,transcriptionStatus:c.transcriptionStatus,analysisStatus:c.analysisStatus})))||[],h=(o||d).map((c,b)=>({question:c.questionText,answer_text:c.transcript||"[Question Skipped]",analysis:c.analysis||{scores:{relevance:0,clarity:0,technicalDepth:0,confidence:0,overall:0},strengths:[],improvements:c.skipped?["Question was skipped"]:["No analysis available"],verdict:c.skipped?"Question was skipped by user":"Analysis not available"},timeUsed:c.timeUsed||0,allocatedTime:c.allocatedTime||120,skipped:c.skipped,transcriptionStatus:c.transcriptionStatus,analysisStatus:c.analysisStatus})),j=()=>{a("/live-interview")},$=()=>{a("/dashboard")},w=()=>{if(n)if(L(n))alert("Report downloaded successfully!");else{const b=Q(n);alert(b?"Report downloaded as text file!":"Failed to generate report. Please try again.")}};return e.jsx("div",{className:`min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4 ${t}`,children:e.jsxs("div",{className:"max-w-6xl mx-auto space-y-8",children:[e.jsxs(v.div,{initial:{opacity:0,y:-20},animate:{opacity:1,y:0},className:"text-center",children:[e.jsx("h1",{className:"text-3xl font-bold text-white mb-2",children:"Interview Results"}),e.jsx("p",{className:"text-gray-400",children:"Comprehensive analysis of your performance"})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-8",children:[e.jsxs(v.div,{initial:{opacity:0,scale:.9},animate:{opacity:1,scale:1},transition:{delay:.2},className:"glass rounded-2xl p-8 border border-surface-border text-center",children:[e.jsx("h2",{className:"text-xl font-semibold text-white mb-6",children:"Overall Score"}),e.jsx("div",{className:"flex justify-center mb-6",children:e.jsx(O,{score:y.overall_score,size:200})}),e.jsxs("div",{className:"grid grid-cols-3 gap-4 mt-6",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"text-2xl font-bold text-blue-400",children:y.answered_questions}),e.jsx("div",{className:"text-xs text-gray-400",children:"Answered"})]}),e.jsxs("div",{className:"text-center",children:[e.jsxs("div",{className:"text-2xl font-bold text-green-400",children:[y.analysis_success_rate,"%"]}),e.jsx("div",{className:"text-xs text-gray-400",children:"Success Rate"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"text-2xl font-bold text-purple-400",children:y.total_questions}),e.jsx("div",{className:"text-xs text-gray-400",children:"Total Questions"})]})]})]}),e.jsxs(v.div,{initial:{opacity:0,scale:.9},animate:{opacity:1,scale:1},transition:{delay:.4},className:"glass rounded-2xl p-8 border border-surface-border text-center",children:[e.jsx("h2",{className:"text-xl font-semibold text-white mb-6",children:"Performance Dimensions"}),e.jsx("div",{className:"flex justify-center",children:e.jsx(_,{data:g,size:280})})]})]}),r&&e.jsxs(v.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:.6},className:"grid grid-cols-1 lg:grid-cols-3 gap-6",children:[e.jsxs("div",{className:"glass rounded-xl p-6 border border-surface-border",children:[e.jsxs("h3",{className:"text-lg font-semibold text-green-400 mb-4 flex items-center gap-2",children:[e.jsx("span",{children:"💪"}),"Top Strengths"]}),e.jsx("div",{className:"space-y-3",children:r.topStrengths.slice(0,3).map((c,b)=>e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("span",{className:`w-6 h-6 bg-green-500/20 border border-green-500/30 rounded-full \r
                      flex items-center justify-center text-green-400 font-bold text-xs flex-shrink-0 mt-0.5`,children:b+1}),e.jsx("p",{className:"text-sm text-gray-300",children:c})]},b))})]}),e.jsxs("div",{className:"glass rounded-xl p-6 border border-surface-border",children:[e.jsxs("h3",{className:"text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2",children:[e.jsx("span",{children:"🎯"}),"Critical Improvements"]}),e.jsx("div",{className:"space-y-3",children:r.criticalImprovements.slice(0,3).map((c,b)=>e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("span",{className:`w-6 h-6 bg-amber-500/20 border border-amber-500/30 rounded-full \r
                      flex items-center justify-center text-amber-400 font-bold text-xs flex-shrink-0 mt-0.5`,children:b+1}),e.jsx("p",{className:"text-sm text-gray-300",children:c})]},b))})]}),e.jsxs("div",{className:"glass rounded-xl p-6 border border-surface-border",children:[e.jsxs("h3",{className:"text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2",children:[e.jsx("span",{children:"🎯"}),"Recommended Focus"]}),e.jsx("div",{className:"bg-blue-500/10 border border-blue-500/30 rounded-lg p-4",children:e.jsx("p",{className:"text-sm text-white leading-relaxed",children:r.recommendedFocus})})]})]}),e.jsxs(v.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:.8},children:[e.jsx("h2",{className:"text-2xl font-semibold text-white mb-6",children:"Question-by-Question Analysis"}),e.jsx(G,{questions:h})]}),e.jsxs(v.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:1},className:"flex flex-col sm:flex-row gap-4 pt-8",children:[e.jsxs(v.button,{onClick:j,whileHover:{scale:1.02},whileTap:{scale:.98},className:`flex-1 bg-gradient-accent text-white py-4 px-6 rounded-xl hover:shadow-xl \r
              transition-all duration-200 font-semibold professional-glow flex items-center justify-center gap-2`,children:[e.jsx("span",{children:"🔄"}),"Retry Interview"]}),e.jsxs(v.button,{onClick:$,whileHover:{scale:1.02},whileTap:{scale:.98},className:`flex-1 glass glass-hover text-white py-4 px-6 rounded-xl \r
              transition-all duration-200 font-semibold flex items-center justify-center gap-2`,children:[e.jsx("span",{children:"📊"}),"Go to Dashboard"]}),e.jsxs(v.button,{onClick:w,whileHover:{scale:1.02},whileTap:{scale:.98},className:`flex-1 bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-xl \r
              transition-all duration-200 font-semibold flex items-center justify-center gap-2`,children:[e.jsx("span",{children:"📄"}),"Download PDF Report"]})]}),r&&l&&e.jsxs(v.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:1.2},className:"border-t border-surface-border pt-8",children:[e.jsx("h2",{className:"text-2xl font-semibold text-white mb-6",children:"Detailed Coaching Summary"}),e.jsx(H,{sessionSummary:r,performanceInsights:l})]})]})})};export{W as default};
