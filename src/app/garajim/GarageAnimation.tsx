"use client";

import { useState, useEffect } from "react";

function Car() {
  return (
    <div style={{ position:"relative", width:50, height:28 }}>
      <div style={{ position:"absolute", bottom:10, left:9, right:11, height:11, background:"#1a4a88", borderRadius:"3px 3px 0 0" }}/>
      <div style={{ position:"absolute", bottom:11, right:12, width:9, height:8, background:"#90c8f0", borderRadius:"2px 2px 0 0" }}/>
      <div style={{ position:"absolute", bottom:11, left:10, width:9, height:8, background:"#90c8f0", borderRadius:"2px 2px 0 0" }}/>
      <div style={{ position:"absolute", bottom:4, left:2, right:2, height:10, background:"#2a6ab8", borderRadius:2 }}/>
      <div style={{ position:"absolute", bottom:4, right:2, width:5, height:8, background:"#1a4a88", borderRadius:"0 1px 1px 0" }}/>
      <div style={{ position:"absolute", bottom:7, right:0, width:3, height:4, background:"#fff5b0", borderRadius:1, boxShadow:"3px 0 10px 5px rgba(255,235,100,0.75)" }}/>
      <div style={{ position:"absolute", bottom:0, right:5, width:11, height:11, borderRadius:"50%", background:"#1a1a1a", border:"2px solid #4a4a4a" }}/>
      <div style={{ position:"absolute", bottom:0, left:4, width:11, height:11, borderRadius:"50%", background:"#1a1a1a", border:"2px solid #4a4a4a" }}/>
    </div>
  );
}

function Motorcycle() {
  return (
    <div style={{ position:"relative", width:42, height:30 }}>
      <div style={{ position:"absolute", bottom:22, left:16, width:8, height:7, background:"#1a5210", borderRadius:"50% 50% 0 0" }}/>
      <div style={{ position:"absolute", bottom:13, left:15, width:9, height:12, background:"#2a6a18", borderRadius:"2px 2px 0 0" }}/>
      <div style={{ position:"absolute", bottom:10, left:4, right:5, height:5, background:"#3a8a20", borderRadius:2 }}/>
      <div style={{ position:"absolute", bottom:16, right:7, width:3, height:7, background:"#2a6818" }}/>
      <div style={{ position:"absolute", bottom:12, right:2, width:3, height:4, background:"#fff5b0", borderRadius:1, boxShadow:"3px 0 10px 5px rgba(255,235,100,0.75)" }}/>
      <div style={{ position:"absolute", bottom:0, right:2, width:13, height:13, borderRadius:"50%", background:"#1a1a1a", border:"2px solid #4a4a4a" }}/>
      <div style={{ position:"absolute", bottom:0, left:2, width:13, height:13, borderRadius:"50%", background:"#1a1a1a", border:"2px solid #4a4a4a" }}/>
    </div>
  );
}

function Scooter() {
  return (
    <div style={{ position:"relative", width:38, height:26 }}>
      <div style={{ position:"absolute", bottom:19, left:14, width:7, height:6, background:"#6a1008", borderRadius:"50% 50% 0 0" }}/>
      <div style={{ position:"absolute", bottom:11, left:13, width:8, height:10, background:"#8a1a10", borderRadius:"2px 2px 0 0" }}/>
      <div style={{ position:"absolute", bottom:9, right:2, left:14, height:7, background:"#b03020", borderRadius:"2px 3px 3px 2px" }}/>
      <div style={{ position:"absolute", bottom:9, left:2, width:14, height:6, background:"#b03020", borderRadius:2 }}/>
      <div style={{ position:"absolute", bottom:11, right:1, width:3, height:3, background:"#fff5b0", borderRadius:1, boxShadow:"3px 0 10px 5px rgba(255,235,100,0.75)" }}/>
      <div style={{ position:"absolute", bottom:0, right:2, width:11, height:11, borderRadius:"50%", background:"#1a1a1a", border:"2px solid #4a4a4a" }}/>
      <div style={{ position:"absolute", bottom:0, left:2, width:11, height:11, borderRadius:"50%", background:"#1a1a1a", border:"2px solid #4a4a4a" }}/>
    </div>
  );
}

function NightAnimation() {
  const stars: [number, number, number][] = [
    [32,12,2],[80,6,2],[145,18,2.5],[210,9,1.5],[275,22,2],[340,7,2.5],
    [60,35,1.5],[170,38,2],[290,30,1.5],[15,28,1.5],[420,14,2],[500,8,2.5],
  ];

  return (
    <>
      <style>{`
        @keyframes nCarMove {
          0%, 7%   { transform: translateX(-70px);  opacity: 0; }
          11%      { transform: translateX(10px);   opacity: 1; }
          25%      { transform: translateX(490px);  opacity: 1; }
          31%      { transform: translateX(560px);  opacity: 0; }
          100%     { transform: translateX(560px);  opacity: 0; }
        }
        @keyframes nMotoMove {
          0%, 31%  { transform: translateX(-70px);  opacity: 0; }
          35%      { transform: translateX(10px);   opacity: 1; }
          49%      { transform: translateX(490px);  opacity: 1; }
          55%      { transform: translateX(560px);  opacity: 0; }
          100%     { transform: translateX(560px);  opacity: 0; }
        }
        @keyframes nScooterMove {
          0%, 55%  { transform: translateX(-70px);  opacity: 0; }
          59%      { transform: translateX(10px);   opacity: 1; }
          73%      { transform: translateX(490px);  opacity: 1; }
          79%      { transform: translateX(560px);  opacity: 0; }
          100%     { transform: translateX(560px);  opacity: 0; }
        }
        @keyframes nGarageDoor {
          0%, 7%    { transform: translateY(0); }
          16%, 81%  { transform: translateY(-100%); }
          93%, 100% { transform: translateY(0); }
        }
        @keyframes nGarageLight {
          0%, 14%  { opacity: 0; }
          20%, 79% { opacity: 1; }
          90%, 100%{ opacity: 0; }
        }
        @keyframes nLampGlow {
          0%, 100% { opacity: 0.65; }
          50%      { opacity: 1; }
        }
        @keyframes nMoonPulse {
          0%, 100% { box-shadow: 0 0 12px rgba(210,180,90,0.55),0 0 28px rgba(210,180,90,0.18); }
          50%      { box-shadow: 0 0 20px rgba(210,180,90,0.85),0 0 40px rgba(210,180,90,0.32); }
        }
      `}</style>

      <div
        className="relative w-full rounded-2xl overflow-hidden mb-6 select-none"
        style={{ height:215, background:"linear-gradient(180deg,#0f1923 0%,#1c2d4a 100%)" }}
      >
        {stars.map(([x,y,r],i) => (
          <div key={i} style={{
            position:"absolute", left:x, top:y, width:r*2, height:r*2,
            borderRadius:"50%", background:"white",
            opacity:0.5+(i%4)*0.14,
            boxShadow:i%4===0?`0 0 ${r*3}px rgba(255,255,255,0.9)`:undefined,
          }}/>
        ))}

        <div style={{
          position:"absolute", left:28, top:12, width:36, height:36, borderRadius:"50%",
          background:"radial-gradient(circle at 38% 38%,#f8f0c8,#d4b860)",
          animation:"nMoonPulse 4s ease-in-out infinite",
        }}>
          <div style={{ position:"absolute", right:-5, top:6, width:30, height:26, borderRadius:"50%", background:"#182640" }}/>
        </div>

        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:54, background:"#1e1e1e" }}>
          <div style={{
            position:"absolute", top:"40%", left:0, right:0, height:3,
            backgroundImage:"repeating-linear-gradient(to right,#3a3a3a 0px,#3a3a3a 26px,transparent 26px,transparent 54px)"
          }}/>
        </div>
        <div style={{ position:"absolute", bottom:54, left:0, right:0, height:2, background:"#2a3a20" }}/>

        {/* 🌲 Sol kenarda */}
        <div style={{ position:"absolute", left:38, bottom:54, fontSize:36, lineHeight:1, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>🌲</div>

        {/* Sokak lambası */}
        <div style={{ position:"absolute", left:108, bottom:54 }}>
          <div style={{ position:"absolute", bottom:0, left:3, width:3, height:68, background:"#5a5a5a" }}/>
          <div style={{ position:"absolute", bottom:66, left:3, width:22, height:3, background:"#5a5a5a" }}/>
          <div style={{ position:"absolute", bottom:62, left:16, width:14, height:7, background:"#888", borderRadius:"2px 2px 0 0" }}/>
          <div style={{
            position:"absolute", bottom:54, left:12, width:22, height:22,
            background:"rgba(255,225,90,0.3)", borderRadius:"50%",
            filter:"blur(6px)", animation:"nLampGlow 3s ease-in-out infinite",
          }}/>
          <div style={{
            position:"absolute", bottom:54, left:6, width:30, height:24,
            background:"rgba(255,210,60,0.07)",
            clipPath:"polygon(25% 0%,75% 0%,100% 100%,0% 100%)",
          }}/>
        </div>

        {/* Bank */}
        <div style={{ position:"absolute", left:142, bottom:54 }}>
          <div style={{ position:"absolute", bottom:8, left:0, width:36, height:5, background:"#6b4c2a", borderRadius:1 }}/>
          <div style={{ position:"absolute", bottom:16, left:2, width:32, height:4, background:"#7d5a35", borderRadius:1 }}/>
          <div style={{ position:"absolute", bottom:0, left:2, width:4, height:8, background:"#5a3e20", borderRadius:1 }}/>
          <div style={{ position:"absolute", bottom:0, left:16, width:4, height:8, background:"#5a3e20", borderRadius:1 }}/>
          <div style={{ position:"absolute", bottom:0, right:2, width:4, height:8, background:"#5a3e20", borderRadius:1 }}/>
          <div style={{ position:"absolute", bottom:8, left:4, width:3, height:12, background:"#5a3e20" }}/>
          <div style={{ position:"absolute", bottom:8, right:4, width:3, height:12, background:"#5a3e20" }}/>
        </div>

        {/* Ağaçlar */}
        <div style={{ position:"absolute", left:195, bottom:54, fontSize:38, lineHeight:1, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>🌲</div>
        <div style={{ position:"absolute", left:268, bottom:54, fontSize:33, lineHeight:1, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>🌲</div>
        <div style={{ position:"absolute", left:335, bottom:54, fontSize:36, lineHeight:1, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>🌲</div>

        {/* İkinci sokak lambası */}
        <div style={{ position:"absolute", left:408, bottom:54 }}>
          <div style={{ position:"absolute", bottom:0, left:3, width:3, height:68, background:"#5a5a5a" }}/>
          <div style={{ position:"absolute", bottom:66, left:3, width:22, height:3, background:"#5a5a5a" }}/>
          <div style={{ position:"absolute", bottom:62, left:16, width:14, height:7, background:"#888", borderRadius:"2px 2px 0 0" }}/>
          <div style={{ position:"absolute", bottom:54, left:12, width:22, height:22, background:"rgba(255,225,90,0.3)", borderRadius:"50%", filter:"blur(6px)", animation:"nLampGlow 3s ease-in-out infinite" }}/>
          <div style={{ position:"absolute", bottom:54, left:6, width:30, height:24, background:"rgba(255,210,60,0.07)", clipPath:"polygon(25% 0%,75% 0%,100% 100%,0% 100%)" }}/>
        </div>

        {/* 🌲 Lamba ile P tabelası arasında */}
        <div style={{ position:"absolute", left:478, bottom:54, fontSize:35, lineHeight:1, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>🌲</div>

        {/* P Park Levhası */}
        <div style={{ position:"absolute", right:196, bottom:54 }}>
          <div style={{ position:"absolute", left:11, bottom:0, width:2, height:30, background:"#555" }}/>
          <div style={{
            position:"absolute", bottom:30, left:0, width:24, height:24, borderRadius:4,
            background:"#1a56aa", border:"2px solid #4a90e2",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 0 10px rgba(26,86,170,0.6)",
          }}>
            <span style={{ color:"white", fontWeight:900, fontSize:15, fontFamily:"Arial,sans-serif", lineHeight:1 }}>P</span>
          </div>
        </div>

        {/* Garaj — sağda */}
        <div style={{ position:"absolute", right:36, bottom:54, width:126, height:112 }}>
          <div style={{ position:"absolute", top:-14, left:-12, right:-12, height:20, background:"#424242", borderRadius:"5px 5px 0 0" }}/>
          <div style={{ position:"absolute", top:6, left:0, right:0, bottom:0, background:"#323232" }}/>
          <div style={{ position:"absolute", top:16, left:8, width:26, height:20, background:"#7ab4d8", opacity:0.5, borderRadius:2 }}/>
          <div style={{ position:"absolute", top:16, left:21, width:1, height:20, background:"#5a90b0", opacity:0.5 }}/>
          <div style={{ position:"absolute", top:26, left:8, width:26, height:1, background:"#5a90b0", opacity:0.5 }}/>
          <div style={{ position:"absolute", bottom:0, left:13, width:2, height:82, background:"#555" }}/>
          <div style={{ position:"absolute", bottom:0, right:13, width:2, height:82, background:"#555" }}/>
          <div style={{ position:"absolute", bottom:0, left:15, right:15, height:82, overflow:"hidden" }}>
            <div style={{
              position:"absolute", inset:0,
              background:"linear-gradient(to bottom,rgba(255,150,30,0.55),rgba(200,80,10,0.25))",
              animation:"nGarageLight 9s infinite",
            }}/>
            <div style={{ position:"absolute", top:0, left:0, right:0, animation:"nGarageDoor 9s infinite ease-in-out" }}>
              {[0,1,2,3].map(i=>(
                <div key={i} style={{ height:20, borderBottom:"2px solid #555", background:i%2===0?"#585858":"#4e4e4e" }}/>
              ))}
            </div>
          </div>
        </div>

        {/* 🌲 Garajın sağında */}
        <div style={{ position:"absolute", right:4, bottom:54, fontSize:34, lineHeight:1, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>🌲</div>

        <div style={{ position:"absolute", bottom:54, left:0, animation:"nCarMove 9s infinite" }}><Car /></div>
        <div style={{ position:"absolute", bottom:54, left:0, animation:"nMotoMove 9s infinite" }}><Motorcycle /></div>
        <div style={{ position:"absolute", bottom:54, left:0, animation:"nScooterMove 9s infinite" }}><Scooter /></div>
      </div>
    </>
  );
}

function DayAnimation() {
  return (
    <>
      <style>{`
        @keyframes dCarExit {
          0%, 3%   { transform: translateX(0);    opacity: 0; }
          7%       { transform: translateX(5px);  opacity: 1; }
          30%      { transform: translateX(455px);opacity: 1; }
          35%      { transform: translateX(515px);opacity: 0; }
          100%     { transform: translateX(515px);opacity: 0; }
        }
        @keyframes dMotoExit {
          0%, 37%  { transform: translateX(0);    opacity: 0; }
          41%      { transform: translateX(5px);  opacity: 1; }
          63%      { transform: translateX(455px);opacity: 1; }
          68%      { transform: translateX(515px);opacity: 0; }
          100%     { transform: translateX(515px);opacity: 0; }
        }
        @keyframes dScooterExit {
          0%, 70%  { transform: translateX(0);    opacity: 0; }
          74%      { transform: translateX(5px);  opacity: 1; }
          95%      { transform: translateX(455px);opacity: 1; }
          100%     { transform: translateX(515px);opacity: 0; }
        }
        @keyframes dGarageDoor {
          0%, 5%    { transform: translateY(0); }
          14%, 92%  { transform: translateY(-100%); }
          100%      { transform: translateY(0); }
        }
        @keyframes dCloud1 { 0%,100%{ transform:translateX(0);} 50%{ transform:translateX(10px);} }
        @keyframes dCloud2 { 0%,100%{ transform:translateX(0);} 50%{ transform:translateX(-8px);} }
        @keyframes dCloud3 { 0%,100%{ transform:translateX(0);} 50%{ transform:translateX(6px);} }
        @keyframes dCloud4 { 0%,100%{ transform:translateX(0);} 50%{ transform:translateX(-10px);} }
        @keyframes dBird1 {
          0%   { transform: translateX(0px) translateY(0px); opacity:0; }
          5%   { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateX(560px) translateY(-10px); opacity:0; }
        }
        @keyframes dBird2 {
          0%   { transform: translateX(0px) translateY(0px); opacity:0; }
          5%   { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateX(480px) translateY(8px); opacity:0; }
        }
        @keyframes dSunPulse { 0%,100%{ opacity:0.92;} 50%{ opacity:1;} }
      `}</style>

      <div
        className="relative w-full rounded-2xl overflow-hidden mb-6 select-none"
        style={{ height:215, background:"linear-gradient(180deg,#5ba8d4 0%,#9ed0ec 52%,#cce8f6 100%)" }}
      >
        {/* Güneş */}
        <div style={{
          position:"absolute", right:28, top:12, width:38, height:38, borderRadius:"50%",
          background:"radial-gradient(circle at 42% 42%,#fff8cc,#f5c840)",
          animation:"dSunPulse 3s ease-in-out infinite",
          boxShadow:"0 0 20px rgba(245,200,60,0.35)",
        }}/>

        {/* Bulut 1 */}
        <div style={{ position:"absolute", left:90, top:12, animation:"dCloud1 7s ease-in-out infinite" }}>
          <div style={{ position:"relative", width:70, height:26 }}>
            <div style={{ position:"absolute", bottom:0, left:0, right:0, height:16, background:"white", borderRadius:12, opacity:0.93 }}/>
            <div style={{ position:"absolute", bottom:9, left:10, width:28, height:22, background:"white", borderRadius:"50%", opacity:0.93 }}/>
            <div style={{ position:"absolute", bottom:9, left:28, width:20, height:18, background:"white", borderRadius:"50%", opacity:0.93 }}/>
          </div>
        </div>

        {/* Bulut 2 */}
        <div style={{ position:"absolute", left:230, top:8, animation:"dCloud2 9s ease-in-out infinite" }}>
          <div style={{ position:"relative", width:54, height:20 }}>
            <div style={{ position:"absolute", bottom:0, left:0, right:0, height:13, background:"white", borderRadius:10, opacity:0.88 }}/>
            <div style={{ position:"absolute", bottom:7, left:7, width:22, height:18, background:"white", borderRadius:"50%", opacity:0.88 }}/>
            <div style={{ position:"absolute", bottom:7, left:22, width:16, height:14, background:"white", borderRadius:"50%", opacity:0.88 }}/>
          </div>
        </div>

        {/* Bulut 3 */}
        <div style={{ position:"absolute", left:360, top:18, animation:"dCloud3 6s ease-in-out infinite" }}>
          <div style={{ position:"relative", width:62, height:22 }}>
            <div style={{ position:"absolute", bottom:0, left:0, right:0, height:14, background:"white", borderRadius:10, opacity:0.85 }}/>
            <div style={{ position:"absolute", bottom:8, left:8, width:25, height:20, background:"white", borderRadius:"50%", opacity:0.85 }}/>
            <div style={{ position:"absolute", bottom:8, left:26, width:18, height:15, background:"white", borderRadius:"50%", opacity:0.85 }}/>
          </div>
        </div>

        {/* Bulut 4 */}
        <div style={{ position:"absolute", left:155, top:32, animation:"dCloud4 11s ease-in-out infinite" }}>
          <div style={{ position:"relative", width:40, height:14 }}>
            <div style={{ position:"absolute", bottom:0, left:0, right:0, height:10, background:"white", borderRadius:8, opacity:0.75 }}/>
            <div style={{ position:"absolute", bottom:5, left:6, width:16, height:12, background:"white", borderRadius:"50%", opacity:0.75 }}/>
          </div>
        </div>

        {/* Kuşlar */}
        <div style={{ position:"absolute", left:20, top:28, animation:"dBird1 12s linear infinite" }}>
          <svg width="28" height="10" viewBox="0 0 28 10" fill="none">
            <path d="M1 7 Q7 1 14 5 Q21 1 27 7" stroke="rgba(30,30,60,0.65)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          </svg>
        </div>
        <div style={{ position:"absolute", left:8, top:40, animation:"dBird2 16s linear infinite 4s" }}>
          <svg width="20" height="8" viewBox="0 0 20 8" fill="none">
            <path d="M1 6 Q5 1 10 4 Q15 1 19 6" stroke="rgba(30,30,60,0.5)" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
          </svg>
        </div>
        <div style={{ position:"absolute", left:14, top:20, animation:"dBird1 19s linear infinite 9s" }}>
          <svg width="16" height="6" viewBox="0 0 16 6" fill="none">
            <path d="M1 5 Q4 1 8 3 Q12 1 15 5" stroke="rgba(30,30,60,0.45)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
          </svg>
        </div>

        {/* Yol */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:54, background:"#8a8a8a" }}>
          <div style={{
            position:"absolute", top:"40%", left:0, right:0, height:3,
            backgroundImage:"repeating-linear-gradient(to right,#cccccc 0px,#cccccc 26px,transparent 26px,transparent 54px)"
          }}/>
        </div>
        <div style={{ position:"absolute", bottom:54, left:0, right:0, height:2, background:"#6aaa4a" }}/>

        {/* Garaj — solda, kapı sağa bakıyor */}
        <div style={{ position:"absolute", left:50, bottom:54, width:126, height:112 }}>
          <div style={{ position:"absolute", top:-14, left:-12, right:-12, height:20, background:"#b0b0b0", borderRadius:"5px 5px 0 0" }}/>
          <div style={{ position:"absolute", top:6, left:0, right:0, bottom:0, background:"#c8c8c8" }}/>
          <div style={{ position:"absolute", top:16, left:8, width:26, height:20, background:"#aad4ee", opacity:0.7, borderRadius:2 }}/>
          <div style={{ position:"absolute", top:16, left:21, width:1, height:20, background:"#88b8d8", opacity:0.6 }}/>
          <div style={{ position:"absolute", top:26, left:8, width:26, height:1, background:"#88b8d8", opacity:0.6 }}/>
          <div style={{ position:"absolute", bottom:0, left:40, width:2, height:82, background:"#aaa" }}/>
          <div style={{ position:"absolute", bottom:0, right:6, width:2, height:82, background:"#aaa" }}/>
          <div style={{ position:"absolute", bottom:0, left:42, right:8, height:82, overflow:"hidden" }}>
            <div style={{
              position:"absolute", inset:0,
              background:"linear-gradient(to bottom,rgba(255,190,70,0.50),rgba(220,150,40,0.25))",
            }}/>
            <div style={{ position:"absolute", top:0, left:0, right:0, animation:"dGarageDoor 18s infinite ease-in-out" }}>
              {[0,1,2,3].map(i=>(
                <div key={i} style={{ height:20, borderBottom:"2px solid #aaa", background:i%2===0?"#d4d4d4":"#c8c8c8" }}/>
              ))}
            </div>
          </div>
        </div>

        {/* P Tabelası — garaj sağında */}
        <div style={{ position:"absolute", left:183, bottom:54 }}>
          <div style={{ position:"absolute", left:11, bottom:0, width:2, height:30, background:"#888" }}/>
          <div style={{
            position:"absolute", bottom:30, left:0, width:24, height:24, borderRadius:4,
            background:"#1a56aa", border:"2px solid #4a90e2",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 0 10px rgba(26,86,170,0.6)",
          }}>
            <span style={{ color:"white", fontWeight:900, fontSize:15, fontFamily:"Arial,sans-serif", lineHeight:1 }}>P</span>
          </div>
        </div>

        {/* Ağaçlar */}
        <div style={{ position:"absolute", left:222, bottom:54, fontSize:36, lineHeight:1, filter:"drop-shadow(0 2px 3px rgba(0,0,0,0.12))" }}>🌳</div>
        <div style={{ position:"absolute", left:278, bottom:54, fontSize:32, lineHeight:1, filter:"drop-shadow(0 2px 3px rgba(0,0,0,0.12))" }}>🌳</div>
        <div style={{ position:"absolute", left:328, bottom:54, fontSize:38, lineHeight:1, filter:"drop-shadow(0 2px 3px rgba(0,0,0,0.12))" }}>🌳</div>
        <div style={{ position:"absolute", left:388, bottom:54, fontSize:33, lineHeight:1, filter:"drop-shadow(0 2px 3px rgba(0,0,0,0.12))" }}>🌳</div>

        {/* Sokak lambası — kapalı */}
        <div style={{ position:"absolute", left:436, bottom:54 }}>
          <div style={{ position:"absolute", bottom:0, left:3, width:3, height:68, background:"#7a7a7a" }}/>
          <div style={{ position:"absolute", bottom:66, left:3, width:22, height:3, background:"#7a7a7a" }}/>
          <div style={{ position:"absolute", bottom:62, left:16, width:14, height:7, background:"#999", borderRadius:"2px 2px 0 0" }}/>
        </div>

        {/* Bank */}
        <div style={{ position:"absolute", left:466, bottom:54 }}>
          <div style={{ position:"absolute", bottom:8, left:0, width:36, height:5, background:"#8b6340", borderRadius:1 }}/>
          <div style={{ position:"absolute", bottom:16, left:2, width:32, height:4, background:"#a0754e", borderRadius:1 }}/>
          <div style={{ position:"absolute", bottom:0, left:2, width:4, height:8, background:"#7a5230", borderRadius:1 }}/>
          <div style={{ position:"absolute", bottom:0, left:16, width:4, height:8, background:"#7a5230", borderRadius:1 }}/>
          <div style={{ position:"absolute", bottom:0, right:2, width:4, height:8, background:"#7a5230", borderRadius:1 }}/>
          <div style={{ position:"absolute", bottom:8, left:4, width:3, height:12, background:"#7a5230" }}/>
          <div style={{ position:"absolute", bottom:8, right:4, width:3, height:12, background:"#7a5230" }}/>
        </div>

        {/* İkinci sokak lambası (sağ) */}
        <div style={{ position:"absolute", left:534, bottom:54 }}>
          <div style={{ position:"absolute", bottom:0, left:3, width:3, height:68, background:"#7a7a7a" }}/>
          <div style={{ position:"absolute", bottom:66, left:3, width:22, height:3, background:"#7a7a7a" }}/>
          <div style={{ position:"absolute", bottom:62, left:16, width:14, height:7, background:"#999", borderRadius:"2px 2px 0 0" }}/>
        </div>

        {/* İkinci bank (sağ lamba yanı) */}
        <div style={{ position:"absolute", left:564, bottom:54 }}>
          <div style={{ position:"absolute", bottom:8, left:0, width:36, height:5, background:"#8b6340", borderRadius:1 }}/>
          <div style={{ position:"absolute", bottom:16, left:2, width:32, height:4, background:"#a0754e", borderRadius:1 }}/>
          <div style={{ position:"absolute", bottom:0, left:2, width:4, height:8, background:"#7a5230", borderRadius:1 }}/>
          <div style={{ position:"absolute", bottom:0, left:16, width:4, height:8, background:"#7a5230", borderRadius:1 }}/>
          <div style={{ position:"absolute", bottom:0, right:2, width:4, height:8, background:"#7a5230", borderRadius:1 }}/>
          <div style={{ position:"absolute", bottom:8, left:4, width:3, height:12, background:"#7a5230" }}/>
          <div style={{ position:"absolute", bottom:8, right:4, width:3, height:12, background:"#7a5230" }}/>
        </div>

        {/* 🌳 Sağ kenarda */}
        <div style={{ position:"absolute", right:6, bottom:54, fontSize:34, lineHeight:1, filter:"drop-shadow(0 2px 3px rgba(0,0,0,0.12))" }}>🌳</div>

        {/* Araçlar — garajdan çıkıyor, biri bitmeden diğeri başlamıyor */}
        <div style={{ position:"absolute", bottom:54, left:176, animation:"dCarExit 18s infinite" }}><Car /></div>
        <div style={{ position:"absolute", bottom:54, left:176, animation:"dMotoExit 18s infinite" }}><Motorcycle /></div>
        <div style={{ position:"absolute", bottom:54, left:176, animation:"dScooterExit 18s infinite" }}><Scooter /></div>
      </div>
    </>
  );
}

export function GarageAnimation({ userName: _userName }: { userName: string }) {
  const [isDay, setIsDay] = useState(false);

  useEffect(() => {
    const h = new Date().getHours();
    setIsDay(h >= 7 && h < 20);
  }, []);

  return isDay ? <DayAnimation /> : <NightAnimation />;
}
