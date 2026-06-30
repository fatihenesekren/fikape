"use client";

function Car() {
  return (
    <div style={{ position:"relative", width:50, height:28 }}>
      {/* Cabin */}
      <div style={{ position:"absolute", bottom:10, left:9, right:11, height:11, background:"#1a4a88", borderRadius:"3px 3px 0 0" }}/>
      {/* Front window */}
      <div style={{ position:"absolute", bottom:11, right:12, width:9, height:8, background:"#90c8f0", borderRadius:"2px 2px 0 0" }}/>
      {/* Rear window */}
      <div style={{ position:"absolute", bottom:11, left:10, width:9, height:8, background:"#90c8f0", borderRadius:"2px 2px 0 0" }}/>
      {/* Body */}
      <div style={{ position:"absolute", bottom:4, left:2, right:2, height:10, background:"#2a6ab8", borderRadius:2 }}/>
      {/* Front bumper */}
      <div style={{ position:"absolute", bottom:4, right:2, width:5, height:8, background:"#1a4a88", borderRadius:"0 1px 1px 0" }}/>
      {/* Headlight */}
      <div style={{ position:"absolute", bottom:7, right:0, width:3, height:4, background:"#fff5b0", borderRadius:1, boxShadow:"3px 0 10px 5px rgba(255,235,100,0.75)" }}/>
      {/* Front wheel */}
      <div style={{ position:"absolute", bottom:0, right:5, width:11, height:11, borderRadius:"50%", background:"#1a1a1a", border:"2px solid #4a4a4a" }}/>
      {/* Rear wheel */}
      <div style={{ position:"absolute", bottom:0, left:4, width:11, height:11, borderRadius:"50%", background:"#1a1a1a", border:"2px solid #4a4a4a" }}/>
    </div>
  );
}

function Motorcycle() {
  return (
    <div style={{ position:"relative", width:42, height:30 }}>
      {/* Rider helmet */}
      <div style={{ position:"absolute", bottom:22, left:16, width:8, height:7, background:"#1a5210", borderRadius:"50% 50% 0 0" }}/>
      {/* Rider body */}
      <div style={{ position:"absolute", bottom:13, left:15, width:9, height:12, background:"#2a6a18", borderRadius:"2px 2px 0 0" }}/>
      {/* Frame */}
      <div style={{ position:"absolute", bottom:10, left:4, right:5, height:5, background:"#3a8a20", borderRadius:2 }}/>
      {/* Handlebar */}
      <div style={{ position:"absolute", bottom:16, right:7, width:3, height:7, background:"#2a6818" }}/>
      {/* Headlight */}
      <div style={{ position:"absolute", bottom:12, right:2, width:3, height:4, background:"#fff5b0", borderRadius:1, boxShadow:"3px 0 10px 5px rgba(255,235,100,0.75)" }}/>
      {/* Front wheel */}
      <div style={{ position:"absolute", bottom:0, right:2, width:13, height:13, borderRadius:"50%", background:"#1a1a1a", border:"2px solid #4a4a4a" }}/>
      {/* Rear wheel */}
      <div style={{ position:"absolute", bottom:0, left:2, width:13, height:13, borderRadius:"50%", background:"#1a1a1a", border:"2px solid #4a4a4a" }}/>
    </div>
  );
}

function Scooter() {
  return (
    <div style={{ position:"relative", width:38, height:26 }}>
      {/* Rider helmet */}
      <div style={{ position:"absolute", bottom:19, left:14, width:7, height:6, background:"#6a1008", borderRadius:"50% 50% 0 0" }}/>
      {/* Rider body */}
      <div style={{ position:"absolute", bottom:11, left:13, width:8, height:10, background:"#8a1a10", borderRadius:"2px 2px 0 0" }}/>
      {/* Front body */}
      <div style={{ position:"absolute", bottom:9, right:2, left:14, height:7, background:"#b03020", borderRadius:"2px 3px 3px 2px" }}/>
      {/* Rear body */}
      <div style={{ position:"absolute", bottom:9, left:2, width:14, height:6, background:"#b03020", borderRadius:2 }}/>
      {/* Headlight */}
      <div style={{ position:"absolute", bottom:11, right:1, width:3, height:3, background:"#fff5b0", borderRadius:1, boxShadow:"3px 0 10px 5px rgba(255,235,100,0.75)" }}/>
      {/* Front wheel */}
      <div style={{ position:"absolute", bottom:0, right:2, width:11, height:11, borderRadius:"50%", background:"#1a1a1a", border:"2px solid #4a4a4a" }}/>
      {/* Rear wheel */}
      <div style={{ position:"absolute", bottom:0, left:2, width:11, height:11, borderRadius:"50%", background:"#1a1a1a", border:"2px solid #4a4a4a" }}/>
    </div>
  );
}

export function GarageAnimation({ userName: _userName }: { userName: string }) {
  const stars: [number, number, number][] = [
    [32,12,2],[80,6,2],[145,18,2.5],[210,9,1.5],[275,22,2],[340,7,2.5],
    [60,35,1.5],[170,38,2],[290,30,1.5],[15,28,1.5],[420,14,2],[500,8,2.5],
  ];

  const trees: [number, number][] = [
    [140,1],[210,0.88],[285,1.08],[355,0.92],[420,1.14],
  ];

  return (
    <>
      <style>{`
        @keyframes carMove {
          0%, 7%   { transform: translateX(-70px);  opacity: 0; }
          11%      { transform: translateX(10px);   opacity: 1; }
          25%      { transform: translateX(490px);  opacity: 1; }
          31%      { transform: translateX(560px);  opacity: 0; }
          100%     { transform: translateX(560px);  opacity: 0; }
        }
        @keyframes motoMove {
          0%, 31%  { transform: translateX(-70px);  opacity: 0; }
          35%      { transform: translateX(10px);   opacity: 1; }
          49%      { transform: translateX(490px);  opacity: 1; }
          55%      { transform: translateX(560px);  opacity: 0; }
          100%     { transform: translateX(560px);  opacity: 0; }
        }
        @keyframes scooterMove {
          0%, 55%  { transform: translateX(-70px);  opacity: 0; }
          59%      { transform: translateX(10px);   opacity: 1; }
          73%      { transform: translateX(490px);  opacity: 1; }
          79%      { transform: translateX(560px);  opacity: 0; }
          100%     { transform: translateX(560px);  opacity: 0; }
        }
        @keyframes garageDoor {
          0%, 7%    { transform: translateY(0); }
          16%, 81%  { transform: translateY(-100%); }
          93%, 100% { transform: translateY(0); }
        }
        @keyframes garageLight {
          0%, 14%  { opacity: 0; }
          20%, 79% { opacity: 1; }
          90%, 100%{ opacity: 0; }
        }
        @keyframes lampGlow {
          0%, 100% { opacity: 0.65; }
          50%      { opacity: 1; }
        }
        @keyframes moonPulse {
          0%, 100% { box-shadow: 0 0 12px rgba(210,180,90,0.55),0 0 28px rgba(210,180,90,0.18); }
          50%      { box-shadow: 0 0 20px rgba(210,180,90,0.85),0 0 40px rgba(210,180,90,0.32); }
        }
      `}</style>

      <div
        className="relative w-full rounded-2xl overflow-hidden mb-6 select-none"
        style={{ height:185, background:"linear-gradient(180deg,#0f1923 0%,#1c2d4a 100%)" }}
      >
        {/* Yıldızlar */}
        {stars.map(([x,y,r],i) => (
          <div key={i} style={{
            position:"absolute", left:x, top:y, width:r*2, height:r*2,
            borderRadius:"50%", background:"white",
            opacity:0.5+(i%4)*0.14,
            boxShadow:i%4===0?`0 0 ${r*3}px rgba(255,255,255,0.9)`:undefined,
          }}/>
        ))}

        {/* Ay */}
        <div style={{
          position:"absolute", left:28, top:12, width:36, height:36, borderRadius:"50%",
          background:"radial-gradient(circle at 38% 38%,#f8f0c8,#d4b860)",
          animation:"moonPulse 4s ease-in-out infinite",
        }}>
          <div style={{ position:"absolute", right:-5, top:6, width:30, height:26, borderRadius:"50%", background:"#182640" }}/>
        </div>

        {/* Yol */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:40, background:"#1e1e1e" }}>
          <div style={{
            position:"absolute", top:"40%", left:0, right:0, height:3,
            backgroundImage:"repeating-linear-gradient(to right,#3a3a3a 0px,#3a3a3a 26px,transparent 26px,transparent 54px)"
          }}/>
        </div>
        <div style={{ position:"absolute", bottom:40, left:0, right:0, height:2, background:"#2a3a20" }}/>

        {/* Ağaçlar */}
        {trees.map(([x,scale],i) => (
          <div key={i} style={{
            position:"absolute", left:x, bottom:40,
            fontSize:Math.round(30*scale), lineHeight:1,
            filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
          }}>🌲</div>
        ))}

        {/* Sokak lambası */}
        <div style={{ position:"absolute", left:90, bottom:54 }}>
          <div style={{ position:"absolute", bottom:0, left:3, width:3, height:68, background:"#5a5a5a" }}/>
          <div style={{ position:"absolute", bottom:66, left:3, width:22, height:3, background:"#5a5a5a" }}/>
          <div style={{ position:"absolute", bottom:62, left:16, width:14, height:7, background:"#888", borderRadius:"2px 2px 0 0" }}/>
          <div style={{
            position:"absolute", bottom:40, left:12, width:22, height:22,
            background:"rgba(255,225,90,0.3)", borderRadius:"50%",
            filter:"blur(6px)", animation:"lampGlow 3s ease-in-out infinite",
          }}/>
          <div style={{
            position:"absolute", bottom:40, left:6, width:30, height:24,
            background:"rgba(255,210,60,0.07)",
            clipPath:"polygon(25% 0%,75% 0%,100% 100%,0% 100%)",
          }}/>
        </div>

        {/* P Park Levhası — garajın solunda, yoldan yukarı */}
        <div style={{ position:"absolute", right:196, bottom:54 }}>
          <div style={{ position:"absolute", left:11, bottom:0, width:2, height:30, background:"#555" }}/>
          <div style={{
            position:"absolute", bottom:30, left:0,
            width:24, height:24, borderRadius:4,
            background:"#1a56aa", border:"2px solid #4a90e2",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 0 10px rgba(26,86,170,0.6)",
          }}>
            <span style={{ color:"white", fontWeight:900, fontSize:15, fontFamily:"Arial,sans-serif", lineHeight:1 }}>P</span>
          </div>
        </div>

        {/* GARAJ — sağda */}
        <div style={{ position:"absolute", right:36, bottom:40, width:126, height:112 }}>


          {/* Çatı */}
          <div style={{ position:"absolute", top:-14, left:-12, right:-12, height:20, background:"#424242", borderRadius:"5px 5px 0 0" }}/>
          {/* Duvar */}
          <div style={{ position:"absolute", top:6, left:0, right:0, bottom:0, background:"#323232" }}/>
          {/* Pencere (sol tarafta, garaj sağda olduğu için) */}
          <div style={{ position:"absolute", top:16, left:8, width:26, height:20, background:"#7ab4d8", opacity:0.5, borderRadius:2 }}/>
          <div style={{ position:"absolute", top:16, left:21, width:1, height:20, background:"#5a90b0", opacity:0.5 }}/>
          <div style={{ position:"absolute", top:26, left:8, width:26, height:1, background:"#5a90b0", opacity:0.5 }}/>

          {/* Kapı çerçevesi */}
          <div style={{ position:"absolute", bottom:0, left:13, width:2, height:82, background:"#555" }}/>
          <div style={{ position:"absolute", bottom:0, right:13, width:2, height:82, background:"#555" }}/>

          {/* Kapı alanı */}
          <div style={{ position:"absolute", bottom:0, left:15, right:15, height:82, overflow:"hidden" }}>
            {/* İç ışık — kapı açıkken görünür */}
            <div style={{
              position:"absolute", inset:0,
              background:"linear-gradient(to bottom,rgba(255,150,30,0.55),rgba(200,80,10,0.25))",
              animation:"garageLight 9s infinite",
            }}/>
            {/* Kapı panelleri */}
            <div style={{ position:"absolute", top:0, left:0, right:0, animation:"garageDoor 9s infinite ease-in-out" }}>
              {[0,1,2,3].map(i=>(
                <div key={i} style={{ height:20, borderBottom:"2px solid #555", background:i%2===0?"#585858":"#4e4e4e" }}/>
              ))}
            </div>
          </div>
        </div>

        {/* ARABA — FI mavisi */}
        <div style={{ position:"absolute", bottom:40, left:0, animation:"carMove 9s infinite" }}>
          <Car />
        </div>

        {/* MOTOSİKLET — KA yeşili */}
        <div style={{ position:"absolute", bottom:40, left:0, animation:"motoMove 9s infinite" }}>
          <Motorcycle />
        </div>

        {/* SCOOTER — PE kırmızısı */}
        <div style={{ position:"absolute", bottom:40, left:0, animation:"scooterMove 9s infinite" }}>
          <Scooter />
        </div>
      </div>
    </>
  );
}
